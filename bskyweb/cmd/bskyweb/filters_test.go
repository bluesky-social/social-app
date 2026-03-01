package main

import (
	"encoding/json"
	"testing"

	"github.com/flosch/pongo2/v6"
)

func TestCanonicalizeURLFilter(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "clean URL",
			input:    "https://bsky.app/profile/user",
			expected: "https://bsky.app/profile/user",
		},
		{
			name:     "URL with query params",
			input:    "https://bsky.app/profile/user?utm_source=test",
			expected: "https://bsky.app/profile/user",
		},
		{
			name:     "URL with multiple params",
			input:    "https://bsky.app/profile/user?utm_source=twitter&utm_campaign=test",
			expected: "https://bsky.app/profile/user",
		},
		{
			name:     "URL with fragment",
			input:    "https://bsky.app/profile/user#section",
			expected: "https://bsky.app/profile/user",
		},
		{
			name:     "URL with both params and fragment",
			input:    "https://bsky.app/profile/user?param=1#section",
			expected: "https://bsky.app/profile/user",
		},
		{
			name:     "malformed URL",
			input:    "not-a-url",
			expected: "not-a-url", // Should return original on error
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			inputValue := pongo2.AsValue(tt.input)
			result, err := filterCanonicalizeURL(inputValue, nil)
			if err != nil {
				t.Errorf("filterCanonicalizeURL() error = %v", err)
				return
			}

			if result.String() != tt.expected {
				t.Errorf("filterCanonicalizeURL() = %v, want %v", result.String(), tt.expected)
			}
		})
	}
}

func TestJSONEscapeFilter(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "simple string",
			input:    "hello world",
			expected: "hello world",
		},
		{
			name:     "string with newlines",
			input:    "hello\nworld",
			expected: `hello\nworld`,
		},
		{
			name:     "string with quotes",
			input:    `say "hello"`,
			expected: `say \"hello\"`,
		},
		{
			name:     "string with backslashes",
			input:    `path\to\file`,
			expected: `path\\to\\file`,
		},
		{
			name:     "string with tabs",
			input:    "col1\tcol2",
			expected: `col1\tcol2`,
		},
		{
			name:     "string with carriage return",
			input:    "line1\r\nline2",
			expected: `line1\r\nline2`,
		},
		{
			name:     "complex bio with emojis and newlines",
			input:    "I code, I write, I puzzle\n\n🌐 elenatorro.com\n📬 newsletter@example.com",
			expected: `I code, I write, I puzzle\n\n🌐 elenatorro.com\n📬 newsletter@example.com`,
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			inputValue := pongo2.AsValue(tt.input)
			result, err := filterJSONEscape(inputValue, nil)
			if err != nil {
				t.Errorf("filterJSONEscape() error = %v", err)
				return
			}

			if result.String() != tt.expected {
				t.Errorf("filterJSONEscape() = %v, want %v", result.String(), tt.expected)
			}

			// Verify the result produces valid JSON when used in a string literal
			jsonStr := `{"test":"` + result.String() + `"}`
			var parsed map[string]interface{}
			if err := json.Unmarshal([]byte(jsonStr), &parsed); err != nil {
				t.Errorf("filterJSONEscape() result does not produce valid JSON: %v", err)
			}
		})
	}
}
