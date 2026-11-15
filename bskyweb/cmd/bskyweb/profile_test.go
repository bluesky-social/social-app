package main

import (
	"strings"
	"testing"

	"github.com/flosch/pongo2/v6"
)

func TestBskyProfileCanonicalURL(t *testing.T) {
	baseURL := "https://bsky.app/profile/alice.bsky.social"
	for _, test := range []struct {
		tab  string
		want string
	}{
		{tab: "", want: baseURL},
		{tab: "posts", want: baseURL},
		{tab: "replies", want: baseURL + "?tab=replies"},
		{tab: "media", want: baseURL + "?tab=media"},
		{tab: "videos", want: baseURL + "?tab=videos"},
		{tab: "feeds", want: baseURL + "?tab=feeds"},
		{tab: "starter-packs", want: baseURL + "?tab=starter-packs"},
		{tab: "lists", want: baseURL + "?tab=lists"},
		{tab: "unknown", want: baseURL},
	} {
		t.Run(test.tab, func(t *testing.T) {
			if got := bskyProfileCanonicalURL("alice.bsky.social", test.tab); got != test.want {
				t.Errorf("bskyProfileCanonicalURL(..., %q) = %q, want %q", test.tab, got, test.want)
			}
		})
	}
}

func TestRenderProfileWithTabKeepsCanonicalQuery(t *testing.T) {
	canonicalURL := bskyProfileCanonicalURL("alice.bsky.social", "replies")
	html := renderTemplate(t, "profile.html", pongo2.Context{
		"requestURI":   "https://bsky.app/profile/alice.bsky.social?tab=replies",
		"canonicalURL": canonicalURL,
	})

	if !strings.Contains(html, `<meta property="og:url" content="`+canonicalURL+`">`) {
		t.Errorf("og:url should preserve the selected profile tab; got:\n%s", html)
	}
	if !strings.Contains(html, `<link rel="canonical" href="`+canonicalURL+`" />`) {
		t.Errorf("canonical URL should preserve the selected profile tab; got:\n%s", html)
	}
}

func TestProfileAuthorFeedFilter(t *testing.T) {
	for _, test := range []struct {
		tab          string
		wantFilter   string
		wantIncluded bool
	}{
		{tab: "", wantFilter: "posts_no_replies", wantIncluded: true},
		{tab: "posts", wantFilter: "posts_no_replies", wantIncluded: true},
		{tab: "replies", wantFilter: "posts_with_replies", wantIncluded: true},
		{tab: "media", wantFilter: "posts_with_media", wantIncluded: true},
		{tab: "videos", wantFilter: "posts_with_video", wantIncluded: true},
		{tab: "feeds", wantIncluded: false},
		{tab: "starter-packs", wantIncluded: false},
		{tab: "lists", wantIncluded: false},
		{tab: "unknown", wantFilter: "posts_no_replies", wantIncluded: true},
	} {
		t.Run(test.tab, func(t *testing.T) {
			gotFilter, gotIncluded := profileAuthorFeedFilter(test.tab)
			if gotFilter != test.wantFilter || gotIncluded != test.wantIncluded {
				t.Errorf("profileAuthorFeedFilter(%q) = (%q, %t), want (%q, %t)", test.tab, gotFilter, gotIncluded, test.wantFilter, test.wantIncluded)
			}
		})
	}
}
