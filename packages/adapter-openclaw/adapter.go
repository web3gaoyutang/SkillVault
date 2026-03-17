package openclaw

import (
	model "github.com/skillvault/canonical-model"
)

type Adapter struct {
	installDir string
}

func NewAdapter(installDir string) *Adapter {
	return &Adapter{installDir: installDir}
}

func (a *Adapter) Install(manifest *model.Manifest, artifactDir string) error {
	// TODO: convert canonical package to OpenClaw directory structure
	// and install to a.installDir
	return nil
}

func (a *Adapter) Uninstall(name string) error {
	// TODO: remove installed skill
	return nil
}
