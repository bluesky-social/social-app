package main

import (
	"net/url"

	"github.com/flosch/pongo2/v6"
)

func init() {
	pongo2.RegisterFilter("canonicalize_url", filterCanonicalizeURL)
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
