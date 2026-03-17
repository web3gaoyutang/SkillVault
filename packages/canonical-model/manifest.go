package canonicalmodel

type Manifest struct {
	Name        string   `yaml:"name" json:"name"`
	Version     string   `yaml:"version" json:"version"`
	Description string   `yaml:"description" json:"description"`
	Author      string   `yaml:"author" json:"author"`
	Runtimes    []string `yaml:"runtimes" json:"runtimes"`
	Tags        []string `yaml:"tags" json:"tags"`
	Files       []File   `yaml:"files" json:"files"`
}

type File struct {
	Path string `yaml:"path" json:"path"`
	Type string `yaml:"type" json:"type"`
}

// FileTypes
const (
	FileTypePrompt   = "prompt"
	FileTypeTemplate = "template"
	FileTypeScript   = "script"
	FileTypeConfig   = "config"
)
