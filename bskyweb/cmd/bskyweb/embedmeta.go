package main

import (
	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

// Helpers for extracting Open Graph / Twitter Card metadata from post
// embeds. These produce data for og:* and twitter:* meta tags only — they
// are not used by the schema.org JSON-LD output (which lives in jsonld.go).
//
// The og:video tags exist as a separate code path because JSON-LD does not
// currently emit a VideoObject (deferred — requires `duration` from the
// appview that is not exposed today).

// videoMeta is the metadata needed for og:video meta tags.
type videoMeta struct {
	URL     string
	Type    string
	Width   int64
	Height  int64
	HasSize bool
}

// extractVideoMeta returns og:video metadata for the post if it has a video
// embed, otherwise the zero value. Respects the same embedHidden gate as
// extractPostMedia (in jsonld.go) so og:video and og:image suppression stay
// in sync.
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
