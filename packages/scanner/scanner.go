package scanner

import "context"

type Severity string

const (
	SeverityError   Severity = "error"
	SeverityWarning Severity = "warning"
	SeverityInfo    Severity = "info"
)

type Finding struct {
	RuleName string   `json:"rule_name"`
	Severity Severity `json:"severity"`
	Message  string   `json:"message"`
	File     string   `json:"file,omitempty"`
	Line     int      `json:"line,omitempty"`
}

type Rule interface {
	Name() string
	Scan(ctx context.Context, dir string) ([]Finding, error)
}
