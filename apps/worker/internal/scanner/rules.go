package scanner

import "context"

type Rule interface {
	Name() string
	Check(ctx context.Context, artifactPath string) []Finding
}

type ManifestRule struct{}

func (r *ManifestRule) Name() string { return "manifest_check" }
func (r *ManifestRule) Check(ctx context.Context, artifactPath string) []Finding {
	// TODO: verify manifest.yaml exists and has required fields
	return nil
}

type PathTraversalRule struct{}

func (r *PathTraversalRule) Name() string { return "path_traversal" }
func (r *PathTraversalRule) Check(ctx context.Context, artifactPath string) []Finding {
	// TODO: check for ../ patterns in file paths
	return nil
}

type FilePolicyRule struct{}

func (r *FilePolicyRule) Name() string { return "file_policy" }
func (r *FilePolicyRule) Check(ctx context.Context, artifactPath string) []Finding {
	// TODO: check for executable files, size limits, file count
	return nil
}

type DangerousPatternRule struct{}

func (r *DangerousPatternRule) Name() string { return "dangerous_patterns" }
func (r *DangerousPatternRule) Check(ctx context.Context, artifactPath string) []Finding {
	// TODO: scan for curl/wget/eval in scripts
	return nil
}

func DefaultRules() []Rule {
	return []Rule{
		&ManifestRule{},
		&PathTraversalRule{},
		&FilePolicyRule{},
		&DangerousPatternRule{},
	}
}
