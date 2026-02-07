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

// filterJSONEscape escapes a string for safe embedding within a JSON string literal.
// This handles newlines, tabs, quotes, backslashes, and other control characters.
func filterJSONEscape(in *pongo2.Value, param *pongo2.Value) (*pongo2.Value, *pongo2.Error) {
	str := in.String()
	// json.Marshal will produce a valid JSON string with all special characters escaped
	escaped, err := json.Marshal(str)
	if err != nil {
		return in, nil
	}
	// json.Marshal wraps the string in quotes, so strip them
	// escaped will be like: "hello\nworld" - we want just: hello\nworld
	if len(escaped) >= 2 {
		escaped = escaped[1 : len(escaped)-1]
	}
	return pongo2.AsValue(string(escaped)), nil
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
