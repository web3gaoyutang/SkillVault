package validator

import (
	"fmt"

	model "github.com/skillvault/canonical-model"
)

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation error: %s - %s", e.Field, e.Message)
}

type Validator interface {
	Validate(manifest *model.Manifest) []ValidationError
}

type ManifestValidator struct{}

func NewManifestValidator() *ManifestValidator {
	return &ManifestValidator{}
}

func (v *ManifestValidator) Validate(m *model.Manifest) []ValidationError {
	var errs []ValidationError
	if m.Name == "" {
		errs = append(errs, ValidationError{Field: "name", Message: "name is required"})
	}
	if m.Version == "" {
		errs = append(errs, ValidationError{Field: "version", Message: "version is required"})
	}
	if len(m.Runtimes) == 0 {
		errs = append(errs, ValidationError{Field: "runtimes", Message: "at least one runtime is required"})
	}
	return errs
}
