package main

import (
	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

// Helpers for extracting Open Graph metadata from post embeds. These feed
// og:* / twitter:* meta tags only; the schema.org JSON-LD output lives in
// jsonld.go. og:video has its own path because JSON-LD does not yet emit
// VideoObject (deferred — needs `duration` from the appview).

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
	if pv == nil || pv.Embed == nil || embedHidden {
		return videoMeta{}
	}
	var v *appbsky.EmbedVideo_View
	if pv.Embed.EmbedVideo_View != nil {
		v = pv.Embed.EmbedVideo_View
	} else if pv.Embed.EmbedRecordWithMedia_View != nil &&
		pv.Embed.EmbedRecordWithMedia_View.Media != nil &&
		pv.Embed.EmbedRecordWithMedia_View.Media.EmbedVideo_View != nil {
		v = pv.Embed.EmbedRecordWithMedia_View.Media.EmbedVideo_View
	}
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
