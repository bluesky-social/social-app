package main

import (
	"strings"
	"testing"

	"github.com/flosch/pongo2/v6"
)

// TestProfileTemplateJSONEscape tests that the profile template properly escapes JSON
func TestProfileTemplateJSONEscape(t *testing.T) {
	// Create a simple test template that mimics the LD+JSON structure
	templateStr := `{
  "description": "{{ description|json_escape }}"
}`

	tpl, err := pongo2.FromString(templateStr)
	if err != nil {
		t.Fatalf("Failed to parse template: %v", err)
	}

	tests := []struct {
		name        string
		description string
		wantContain string
	}{
		{
			name:        "description with newlines",
			description: "I code, I write, I puzzle\n🌐 elenatorro.com\n📬 conexionaleatoria.ghost.io",
			wantContain: `"description": "I code, I write, I puzzle\n🌐 elenatorro.com\n📬 conexionaleatoria.ghost.io"`,
		},
		{
			name:        "description with quotes",
			description: `He said "hello"`,
			wantContain: `"description": "He said \"hello\""`,
		},
		{
			name:        "simple description",
			description: "Just a simple bio",
			wantContain: `"description": "Just a simple bio"`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := pongo2.Context{
				"description": tt.description,
			}

			out, err := tpl.Execute(ctx)
			if err != nil {
				t.Fatalf("Failed to execute template: %v", err)
			}

			if !strings.Contains(out, tt.wantContain) {
				t.Errorf("Template output missing expected content.\nGot:\n%s\n\nWant to contain:\n%s", out, tt.wantContain)
			}
		})
	}
}
