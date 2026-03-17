package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	kratoshttp "github.com/go-kratos/kratos/v2/transport/http"
	"github.com/google/wire"

	"github.com/skillvault/api/internal/biz"
	"github.com/skillvault/api/internal/middleware"
)

var ProviderSet = wire.NewSet(NewSkillVaultService)

type SkillVaultService struct {
	authUC    *biz.AuthUsecase
	skillUC   *biz.SkillUsecase
	orgUC     *biz.OrganizationUsecase
	versionUC *biz.VersionUsecase
	auditUC   *biz.AuditUsecase
	tokenUC   *biz.TokenUsecase
}

func NewSkillVaultService(
	authUC *biz.AuthUsecase,
	skillUC *biz.SkillUsecase,
	orgUC *biz.OrganizationUsecase,
	versionUC *biz.VersionUsecase,
	auditUC *biz.AuditUsecase,
	tokenUC *biz.TokenUsecase,
) *SkillVaultService {
	return &SkillVaultService{
		authUC:    authUC,
		skillUC:   skillUC,
		orgUC:     orgUC,
		versionUC: versionUC,
		auditUC:   auditUC,
		tokenUC:   tokenUC,
	}
}

// --- Response helpers ---

func response(ctx kratoshttp.Context, data interface{}) error {
	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"code":    0,
		"message": "success",
		"data":    data,
	})
}

func errorResponse(ctx kratoshttp.Context, status int, msg string) error {
	return ctx.JSON(status, map[string]interface{}{
		"code":    status,
		"message": msg,
	})
}

func requireAuth(ctx kratoshttp.Context) (uint64, error) {
	userID, ok := middleware.UserIDFromContext(ctx)
	if !ok {
		return 0, errorResponse(ctx, http.StatusUnauthorized, "authentication required")
	}
	return userID, nil
}

func handleBizError(ctx kratoshttp.Context, err error) error {
	switch {
	case errors.Is(err, biz.ErrUserExists):
		return errorResponse(ctx, http.StatusConflict, err.Error())
	case errors.Is(err, biz.ErrInvalidCredentials):
		return errorResponse(ctx, http.StatusUnauthorized, err.Error())
	case errors.Is(err, biz.ErrInvalidToken):
		return errorResponse(ctx, http.StatusUnauthorized, err.Error())
	case errors.Is(err, biz.ErrPermissionDenied):
		return errorResponse(ctx, http.StatusForbidden, err.Error())
	case errors.Is(err, biz.ErrOrgNotFound), errors.Is(err, biz.ErrSkillNotFound), errors.Is(err, biz.ErrVersionNotFound), errors.Is(err, biz.ErrMemberNotFound), errors.Is(err, biz.ErrTokenNotFound):
		return errorResponse(ctx, http.StatusNotFound, err.Error())
	case errors.Is(err, biz.ErrOrgExists), errors.Is(err, biz.ErrSkillExists), errors.Is(err, biz.ErrVersionExists), errors.Is(err, biz.ErrMemberExists):
		return errorResponse(ctx, http.StatusConflict, err.Error())
	case errors.Is(err, biz.ErrInvalidStateTransition), errors.Is(err, biz.ErrNotPublished):
		return errorResponse(ctx, http.StatusConflict, err.Error())
	case errors.Is(err, biz.ErrLockFailed):
		return errorResponse(ctx, http.StatusConflict, err.Error())
	case errors.Is(err, biz.ErrUserDisabled):
		return errorResponse(ctx, http.StatusForbidden, err.Error())
	case errors.Is(err, biz.ErrCannotRemoveOwner):
		return errorResponse(ctx, http.StatusForbidden, err.Error())
	default:
		return errorResponse(ctx, http.StatusInternalServerError, "internal server error")
	}
}

// --- Healthz ---

func (s *SkillVaultService) Healthz(ctx kratoshttp.Context) error {
	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"code":    0,
		"message": "ok",
	})
}

// --- Auth handlers ---

func (s *SkillVaultService) Register(ctx kratoshttp.Context) error {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := ctx.Bind(&req); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}
	if req.Username == "" || req.Email == "" || req.Password == "" {
		return errorResponse(ctx, http.StatusBadRequest, "username, email and password are required")
	}
	if len(req.Password) < 8 {
		return errorResponse(ctx, http.StatusBadRequest, "password must be at least 8 characters")
	}

	user, err := s.authUC.Register(ctx, req.Username, req.Email, req.Password)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, map[string]interface{}{"id": user.ID})
}

func (s *SkillVaultService) Login(ctx kratoshttp.Context) error {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := ctx.Bind(&req); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}

	pair, err := s.authUC.Login(ctx, req.Username, req.Password)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, map[string]interface{}{
		"access_token":  pair.AccessToken,
		"refresh_token": pair.RefreshToken,
		"expires_in":    pair.ExpiresIn,
	})
}

func (s *SkillVaultService) RefreshToken(ctx kratoshttp.Context) error {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := ctx.Bind(&req); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}

	pair, err := s.authUC.RefreshToken(ctx, req.RefreshToken)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, map[string]interface{}{
		"access_token":  pair.AccessToken,
		"refresh_token": pair.RefreshToken,
		"expires_in":    pair.ExpiresIn,
	})
}

func (s *SkillVaultService) Logout(ctx kratoshttp.Context) error {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = ctx.Bind(&req)
	_ = s.authUC.Logout(ctx, req.RefreshToken)
	return response(ctx, nil)
}

func (s *SkillVaultService) GetMe(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	user, err := s.authUC.GetCurrentUser(ctx, userID)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, map[string]interface{}{
		"id":           user.ID,
		"username":     user.Username,
		"email":        user.Email,
		"display_name": user.DisplayName,
		"avatar_url":   user.AvatarURL,
	})
}

// --- Organization handlers ---

func (s *SkillVaultService) CreateOrganization(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	var req struct {
		Name        string `json:"name"`
		DisplayName string `json:"display_name"`
		Description string `json:"description"`
	}
	if err := ctx.Bind(&req); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}
	if req.Name == "" {
		return errorResponse(ctx, http.StatusBadRequest, "name is required")
	}

	org, err := s.orgUC.Create(ctx, userID, req.Name, req.DisplayName, req.Description)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, map[string]interface{}{"id": org.ID, "name": org.Name})
}

func (s *SkillVaultService) GetOrganization(ctx kratoshttp.Context) error {
	name := ctx.Vars().Get("org")
	org, err := s.orgUC.Get(ctx, name)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, org)
}

func (s *SkillVaultService) ListOrganizations(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	orgs, err := s.orgUC.ListByUser(ctx, userID)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, orgs)
}

func (s *SkillVaultService) UpdateOrganization(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	name := ctx.Vars().Get("org")
	var req struct {
		DisplayName *string `json:"display_name"`
		Description *string `json:"description"`
	}
	if err := ctx.Bind(&req); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}

	org, err := s.orgUC.Update(ctx, userID, name, req.DisplayName, req.Description)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, org)
}

func (s *SkillVaultService) DeleteOrganization(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	name := ctx.Vars().Get("org")
	if err := s.orgUC.Delete(ctx, userID, name); err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, nil)
}

func (s *SkillVaultService) ListMembers(ctx kratoshttp.Context) error {
	orgName := ctx.Vars().Get("org")
	members, err := s.orgUC.ListMembers(ctx, orgName)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, members)
}

func (s *SkillVaultService) AddMember(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	orgName := ctx.Vars().Get("org")
	var req struct {
		UserID uint64 `json:"user_id"`
		Role   string `json:"role"`
	}
	if err := ctx.Bind(&req); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}

	member, err := s.orgUC.AddMember(ctx, userID, orgName, req.UserID, req.Role)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, member)
}

func (s *SkillVaultService) UpdateMember(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	orgName := ctx.Vars().Get("org")
	targetUserID, _ := strconv.ParseUint(ctx.Vars().Get("user_id"), 10, 64)
	var req struct {
		Role string `json:"role"`
	}
	if err := ctx.Bind(&req); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}

	if err := s.orgUC.UpdateMemberRole(ctx, userID, orgName, targetUserID, req.Role); err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, nil)
}

func (s *SkillVaultService) RemoveMember(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	orgName := ctx.Vars().Get("org")
	targetUserID, _ := strconv.ParseUint(ctx.Vars().Get("user_id"), 10, 64)

	if err := s.orgUC.RemoveMember(ctx, userID, orgName, targetUserID); err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, nil)
}

// --- Skill handlers ---

func (s *SkillVaultService) CreateSkill(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	var req struct {
		OrgName     string   `json:"org_name"`
		Name        string   `json:"name"`
		DisplayName string   `json:"display_name"`
		Description string   `json:"description"`
		Visibility  string   `json:"visibility"`
		Tags        []string `json:"tags"`
		Runtimes    []string `json:"runtimes"`
	}
	if err := ctx.Bind(&req); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}
	if req.OrgName == "" || req.Name == "" {
		return errorResponse(ctx, http.StatusBadRequest, "org_name and name are required")
	}

	skill, err := s.skillUC.Create(ctx, userID, req.OrgName, req.Name, req.DisplayName, req.Description, req.Visibility, req.Tags, req.Runtimes)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, map[string]interface{}{"id": skill.ID})
}

func (s *SkillVaultService) GetSkill(ctx kratoshttp.Context) error {
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")
	skill, err := s.skillUC.Get(ctx, org, name)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, map[string]interface{}{
		"id":             skill.ID,
		"org_name":       skill.OrgName,
		"name":           skill.Name,
		"display_name":   skill.DisplayName,
		"description":    skill.Description,
		"tags":           skill.Tags,
		"visibility":     skill.Visibility,
		"runtimes":       skill.Runtimes,
		"latest_version": skill.LatestVersion,
		"download_count": skill.DownloadCount,
	})
}

func (s *SkillVaultService) ListSkills(ctx kratoshttp.Context) error {
	query := biz.SkillQuery{
		Keyword:    ctx.Query().Get("keyword"),
		Tag:        ctx.Query().Get("tag"),
		Runtime:    ctx.Query().Get("runtime"),
		Visibility: ctx.Query().Get("visibility"),
	}
	if p := ctx.Query().Get("page"); p != "" {
		query.Page, _ = strconv.Atoi(p)
	}
	if ps := ctx.Query().Get("page_size"); ps != "" {
		query.PageSize, _ = strconv.Atoi(ps)
	}
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 {
		query.PageSize = 20
	}

	skills, total, err := s.skillUC.List(ctx, query)
	if err != nil {
		return handleBizError(ctx, err)
	}

	// Populate org names
	type skillResponse struct {
		ID            uint64   `json:"id"`
		OrgName       string   `json:"org_name"`
		Name          string   `json:"name"`
		DisplayName   string   `json:"display_name"`
		Description   string   `json:"description"`
		Tags          []string `json:"tags"`
		Visibility    string   `json:"visibility"`
		Runtimes      []string `json:"runtimes"`
		LatestVersion string   `json:"latest_version"`
		DownloadCount uint64   `json:"download_count"`
	}

	items := make([]skillResponse, len(skills))
	for i, sk := range skills {
		orgName := ""
		if org, err := s.orgUC.Get(ctx, ""); err == nil && org != nil {
			orgName = org.Name
		}
		// Try to resolve org name from OrgID
		if sk.OrgName == "" {
			org, _ := s.orgUC.GetOrgByID(ctx, sk.OrgID)
			if org != nil {
				orgName = org.Name
			}
		} else {
			orgName = sk.OrgName
		}
		items[i] = skillResponse{
			ID:            sk.ID,
			OrgName:       orgName,
			Name:          sk.Name,
			DisplayName:   sk.DisplayName,
			Description:   sk.Description,
			Tags:          sk.Tags,
			Visibility:    sk.Visibility,
			Runtimes:      sk.Runtimes,
			LatestVersion: sk.LatestVersion,
			DownloadCount: sk.DownloadCount,
		}
	}

	return response(ctx, map[string]interface{}{
		"items":     items,
		"total":     total,
		"page":      query.Page,
		"page_size": query.PageSize,
	})
}

func (s *SkillVaultService) UpdateSkill(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")

	var raw map[string]interface{}
	if err := ctx.Bind(&raw); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}

	// Convert tags/runtimes from interface slices to string slices
	updates := make(map[string]interface{})
	for k, v := range raw {
		if k == "tags" || k == "runtimes" {
			if arr, ok := v.([]interface{}); ok {
				strs := make([]string, len(arr))
				for i, item := range arr {
					strs[i] = fmt.Sprintf("%v", item)
				}
				updates[k] = strs
			}
		} else {
			updates[k] = v
		}
	}

	skill, err := s.skillUC.Update(ctx, userID, org, name, updates)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, skill)
}

func (s *SkillVaultService) DeleteSkill(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")

	if err := s.skillUC.Delete(ctx, userID, org, name); err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, nil)
}

// --- Version handlers ---

func (s *SkillVaultService) UploadVersion(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")

	r := ctx.Request()
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "failed to parse multipart form")
	}

	file, header, err := r.FormFile("artifact")
	if err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "artifact file is required")
	}
	defer file.Close()

	version := r.FormValue("version")
	changelog := r.FormValue("changelog")
	if version == "" {
		return errorResponse(ctx, http.StatusBadRequest, "version is required")
	}

	sv, err := s.versionUC.Upload(ctx, userID, org, name, version, changelog, file, header.Size)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, sv)
}

func (s *SkillVaultService) ListVersions(ctx kratoshttp.Context) error {
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")

	versions, err := s.versionUC.List(ctx, org, name)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, versions)
}

func (s *SkillVaultService) GetVersion(ctx kratoshttp.Context) error {
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")
	version := ctx.Vars().Get("version")

	sv, err := s.versionUC.Get(ctx, org, name, version)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, sv)
}

func (s *SkillVaultService) DownloadVersion(ctx kratoshttp.Context) error {
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")
	version := ctx.Vars().Get("version")

	reader, size, checksum, err := s.versionUC.Download(ctx, org, name, version)
	if err != nil {
		return handleBizError(ctx, err)
	}
	defer reader.Close()

	w := ctx.Response()
	w.Header().Set("Content-Type", "application/gzip")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s-%s-%s.tar.gz"`, org, name, version))
	w.Header().Set("Content-Length", strconv.FormatInt(size, 10))
	w.Header().Set("X-Checksum-SHA256", checksum)
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, reader)
	return nil
}

func (s *SkillVaultService) ReviewVersion(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")
	version := ctx.Vars().Get("version")

	var req struct {
		Action  string `json:"action"`
		Comment string `json:"comment"`
	}
	if err := ctx.Bind(&req); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}

	sv, err := s.versionUC.Review(ctx, userID, org, name, version, req.Action, req.Comment)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, sv)
}

func (s *SkillVaultService) PublishVersion(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")
	version := ctx.Vars().Get("version")

	sv, err := s.versionUC.Publish(ctx, userID, org, name, version)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, sv)
}

// --- Scan handlers ---

func (s *SkillVaultService) GetScanResults(ctx kratoshttp.Context) error {
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")
	version := ctx.Vars().Get("version")

	results, err := s.versionUC.GetScanResults(ctx, org, name, version)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, results)
}

func (s *SkillVaultService) Rescan(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")
	version := ctx.Vars().Get("version")

	if err := s.versionUC.Rescan(ctx, userID, org, name, version); err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, nil)
}

// --- Audit handlers ---

func (s *SkillVaultService) ListAuditLogs(ctx kratoshttp.Context) error {
	_, err := requireAuth(ctx)
	if err != nil {
		return err
	}

	query := biz.AuditQuery{
		Action:       ctx.Query().Get("action"),
		ResourceType: ctx.Query().Get("resource_type"),
	}
	if p := ctx.Query().Get("page"); p != "" {
		query.Page, _ = strconv.Atoi(p)
	}
	if ps := ctx.Query().Get("page_size"); ps != "" {
		query.PageSize, _ = strconv.Atoi(ps)
	}
	if oid := ctx.Query().Get("org_id"); oid != "" {
		query.OrgID, _ = strconv.ParseUint(oid, 10, 64)
	}

	logs, total, err := s.auditUC.List(ctx, query)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, map[string]interface{}{
		"items":     logs,
		"total":     total,
		"page":      query.Page,
		"page_size": query.PageSize,
	})
}

// --- Token handlers ---

func (s *SkillVaultService) CreateToken(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	var req struct {
		Name   string   `json:"name"`
		Scopes []string `json:"scopes"`
	}
	if err := ctx.Bind(&req); err != nil {
		return errorResponse(ctx, http.StatusBadRequest, "invalid request body")
	}
	if req.Name == "" {
		return errorResponse(ctx, http.StatusBadRequest, "name is required")
	}

	rawToken, token, err := s.tokenUC.Create(ctx, userID, req.Name, req.Scopes)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, map[string]interface{}{
		"id":           token.ID,
		"name":         token.Name,
		"token":        rawToken,
		"token_prefix": token.TokenPrefix,
		"created_at":   token.CreatedAt,
	})
}

func (s *SkillVaultService) ListTokens(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	tokens, err := s.tokenUC.List(ctx, userID)
	if err != nil {
		return handleBizError(ctx, err)
	}

	items := make([]map[string]interface{}, len(tokens))
	for i, t := range tokens {
		items[i] = map[string]interface{}{
			"id":           t.ID,
			"name":         t.Name,
			"token_prefix": t.TokenPrefix,
			"scopes":       t.Scopes,
			"last_used_at": t.LastUsedAt,
			"expires_at":   t.ExpiresAt,
			"created_at":   t.CreatedAt,
		}
	}
	return response(ctx, items)
}

func (s *SkillVaultService) DeleteToken(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	id, _ := strconv.ParseUint(ctx.Vars().Get("id"), 10, 64)
	if err := s.tokenUC.Delete(ctx, id, userID); err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, nil)
}

// --- Review center (pending reviews for user's orgs) ---

func (s *SkillVaultService) ListPendingReviews(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}

	// Get user's orgs where they have admin+ role
	orgs, err := s.orgUC.ListByUser(ctx, userID)
	if err != nil {
		return handleBizError(ctx, err)
	}
	var orgIDs []uint64
	for _, org := range orgs {
		orgIDs = append(orgIDs, org.ID)
	}

	versions, err := s.versionUC.ListPendingReview(ctx, orgIDs)
	if err != nil {
		return handleBizError(ctx, err)
	}

	// Enrich with skill info
	type reviewItem struct {
		*biz.SkillVersion
		SkillName string `json:"skill_name"`
		OrgName   string `json:"org_name"`
	}
	items := make([]reviewItem, 0, len(versions))
	for _, v := range versions {
		item := reviewItem{SkillVersion: v}
		items = append(items, item)
	}

	return response(ctx, items)
}

// SubmitForReview submits a draft version for review
func (s *SkillVaultService) SubmitForReview(ctx kratoshttp.Context) error {
	userID, err := requireAuth(ctx)
	if err != nil {
		return err
	}
	org := ctx.Vars().Get("org")
	name := ctx.Vars().Get("name")
	version := ctx.Vars().Get("version")

	sv, err := s.versionUC.SubmitForReview(ctx, userID, org, name, version)
	if err != nil {
		return handleBizError(ctx, err)
	}
	return response(ctx, sv)
}

// Keep json import used
var _ = json.Marshal
var _ = strings.TrimSpace
