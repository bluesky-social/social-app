package main

import (
	"encoding/json"
	"net/url"
	"strings"

	"github.com/flosch/pongo2/v6"
)

func init() {
	pongo2.RegisterFilter("canonicalize_url", filterCanonicalizeURL)
	pongo2.RegisterFilter("avatar_thumbnail", filterAvatarThumbnail)
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

func filterAvatarThumbnail(in *pongo2.Value, param *pongo2.Value) (*pongo2.Value, *pongo2.Error) {
	urlStr := in.String()
	return pongo2.AsValue(strings.Replace(urlStr, "/img/avatar/plain/", "/img/avatar_thumbnail/plain/", 1)), nil
}

// filterJSONEscape escapes a string value for safe embedding inside a JSON
// string literal. It uses encoding/json.Marshal to handle newlines, quotes,
// backslashes, and other special characters, then strips the surrounding
// quotes that Marshal adds.
func filterJSONEscape(in *pongo2.Value, param *pongo2.Value) (*pongo2.Value, *pongo2.Error) {
	raw := in.String()
	b, err := json.Marshal(raw)
	if err != nil {
		return in, nil
	}
	// json.Marshal wraps the result in double quotes; strip them since the
	// template already provides surrounding quotes.
	escaped := string(b[1 : len(b)-1])
	return pongo2.AsSafeValue(escaped), nil
}
