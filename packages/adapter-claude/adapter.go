package claude

import (
	"os"
	"path/filepath"

	model "github.com/skillvault/canonical-model"
)

type Scope string

const (
	ScopeProject Scope = "project"
	ScopeUser    Scope = "user"
)

type Adapter struct {
	scope Scope
}

func NewAdapter(scope Scope) *Adapter {
	return &Adapter{scope: scope}
}

func (a *Adapter) InstallDir() string {
	switch a.scope {
	case ScopeProject:
		return filepath.Join(".", ".claude", "skills")
	case ScopeUser:
		home, _ := os.UserHomeDir()
		return filepath.Join(home, ".claude", "skills")
	default:
		return filepath.Join(".", ".claude", "skills")
	}
}

func (a *Adapter) Install(manifest *model.Manifest, artifactDir string) error {
	// TODO: convert canonical package to Claude Code local skill format
	// and install to appropriate directory based on scope
	return nil
}

func (a *Adapter) Uninstall(name string) error {
	// TODO: remove installed skill
	return nil
}
