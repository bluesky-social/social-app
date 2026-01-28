package main

import (
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
			name:     "simple text",
			input:    "Hello world",
			expected: "Hello world",
		},
		{
			name:     "text with newline",
			input:    "Hello\nworld",
			expected: "Hello\\nworld",
		},
		{
			name:     "text with multiple newlines",
			input:    "Line 1\nLine 2\nLine 3",
			expected: "Line 1\\nLine 2\\nLine 3",
		},
		{
			name:     "text with carriage return",
			input:    "Hello\rworld",
			expected: "Hello\\rworld",
		},
		{
			name:     "text with tab",
			input:    "Hello\tworld",
			expected: "Hello\\tworld",
		},
		{
			name:     "text with double quotes",
			input:    `Say "hello"`,
			expected: `Say \"hello\"`,
		},
		{
			name:     "text with backslash",
			input:    `C:\path\to\file`,
			expected: `C:\\path\\to\\file`,
		},
		{
			name:     "complex profile description",
			input:    "I code, I write, I puzzle\n🌐 elenatorro.com\n📬 conexionaleatoria.ghost.io",
			expected: "I code, I write, I puzzle\\n🌐 elenatorro.com\\n📬 conexionaleatoria.ghost.io",
		},
		{
			name:     "text with emoji",
			input:    "Hello 👋 World 🌍",
			expected: "Hello 👋 World 🌍",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "text with mixed special chars",
			input:    "Line 1\nQuoted \"text\"\tTabbed",
			expected: `Line 1\nQuoted \"text\"\tTabbed`,
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
				t.Errorf("filterJSONEscape() = %q, want %q", result.String(), tt.expected)
			}
		})
	}
}
