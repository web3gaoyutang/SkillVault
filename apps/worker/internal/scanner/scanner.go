package scanner

import "context"

type Finding struct {
	Type     string `json:"type"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
	File     string `json:"file,omitempty"`
	Line     int    `json:"line,omitempty"`
}

type Scanner struct {
	rules []Rule
}

func NewScanner() *Scanner {
	return &Scanner{
		rules: DefaultRules(),
	}
}

func (s *Scanner) Scan(ctx context.Context, artifactPath string) []Finding {
	var findings []Finding
	for _, rule := range s.rules {
		if f := rule.Check(ctx, artifactPath); f != nil {
			findings = append(findings, f...)
		}
	}
	return findings
}
