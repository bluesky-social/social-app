package main

import (
	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

// Helpers for extracting Open Graph metadata from post embeds. og:video
// shares findVideoEmbed with the JSON-LD VideoObject path in jsonld.go so
// the two outputs cannot drift.

// videoMeta holds og:video meta tag data.
type videoMeta struct {
	URL     string
	Type    string
	Width   int64
	Height  int64
	HasSize bool
}

// extractVideoMeta returns og:video metadata, or the zero value if there's
// no video embed. Respects embedHidden so og:video and og:image stay in sync.
func extractVideoMeta(pv *appbsky.FeedDefs_PostView, embedHidden bool) videoMeta {
	v := findVideoEmbed(pv, embedHidden)
	if v == nil || v.Playlist == "" {
		return videoMeta{}
	}
	out := videoMeta{
		URL:  v.Playlist,
		Type: "application/vnd.apple.mpegurl",
	}
	if v.AspectRatio != nil {
		out.Width = v.AspectRatio.Width
		out.Height = v.AspectRatio.Height
		out.HasSize = true
	}
	return out
}
