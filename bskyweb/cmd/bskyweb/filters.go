package main

import (
	"encoding/json"
	"net/url"

	"github.com/flosch/pongo2/v6"
)

func init() {
	pongo2.RegisterFilter("canonicalize_url", filterCanonicalizeURL)
	pongo2.RegisterFilter("json_escape", filterJSONEscape)
}

func filterCanonicalizeURL(in *pongo2.Value, param *pongo2.Value) (*pongo2.Value, *pongo2.Error) {
	urlStr := in.String()

	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		// If parsing fails, return the original URL
		return in, nil
	}

	// Remove query parameters and fragment
	parsedURL.RawQuery = ""
	parsedURL.Fragment = ""

	// Return the cleaned URL
	return pongo2.AsValue(parsedURL.String()), nil
}

// filterJSONEscape escapes a string for safe inclusion in JSON.
// It properly handles line breaks, quotes, backslashes, and control characters.
func filterJSONEscape(in *pongo2.Value, param *pongo2.Value) (*pongo2.Value, *pongo2.Error) {
	str := in.String()

	// Use json.Marshal to properly escape the string
	// Marshal adds quotes around the string, so we need to remove them
	escaped, err := json.Marshal(str)
	if err != nil {
		// If marshaling fails, return the original string
		return in, nil
	}

	// Remove the surrounding quotes added by json.Marshal
	// escaped is guaranteed to be at least 2 bytes (the quotes) if Marshal succeeded
	if len(escaped) >= 2 {
		escaped = escaped[1 : len(escaped)-1]
	}

	return pongo2.AsValue(string(escaped)), nil
}
