package main

import (
	"testing"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

func TestExtractVideoMeta(t *testing.T) {
	// Plain post — no video.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc", "hi")
	if vm := extractVideoMeta(pv, false); vm.URL != "" {
		t.Errorf("non-video post produced video meta: %+v", vm)
	}

	// Video embed with playlist + aspect ratio.
	playlist := "https://video.bsky.app/playlist.m3u8"
	pv = makePostView("alice.bsky.social", "did:plc:alice", "abc", "watch")
	pv.Embed = &appbsky.FeedDefs_PostView_Embed{
		EmbedVideo_View: &appbsky.EmbedVideo_View{
			Thumbnail:   strPtr("https://cdn.bsky.app/thumb@jpg"),
			Playlist:    playlist,
			AspectRatio: &appbsky.EmbedDefs_AspectRatio{Width: 16, Height: 9},
		},
	}
	vm := extractVideoMeta(pv, false)
	if vm.URL != playlist {
		t.Errorf("URL wrong: %v", vm.URL)
	}
	if vm.Type != "application/vnd.apple.mpegurl" {
		t.Errorf("Type wrong: %v", vm.Type)
	}
	if !vm.HasSize || vm.Width != 16 || vm.Height != 9 {
		t.Errorf("aspect ratio not propagated: %+v", vm)
	}

	// Hidden embed gate suppresses video too.
	if vm := extractVideoMeta(pv, true); vm.URL != "" {
		t.Errorf("hidden embed should suppress video meta")
	}

	// Video inside record-with-media.
	pv2 := makePostView("alice.bsky.social", "did:plc:alice", "abc", "quote w/ video")
	pv2.Embed = &appbsky.FeedDefs_PostView_Embed{
		EmbedRecordWithMedia_View: &appbsky.EmbedRecordWithMedia_View{
			Media: &appbsky.EmbedRecordWithMedia_View_Media{
				EmbedVideo_View: &appbsky.EmbedVideo_View{Playlist: playlist},
			},
		},
	}
	vm2 := extractVideoMeta(pv2, false)
	if vm2.URL != playlist {
		t.Errorf("record-with-media video URL not extracted: %+v", vm2)
	}
	if vm2.HasSize {
		t.Errorf("expected HasSize=false when no aspect ratio")
	}

	// Video without playlist — skip entirely.
	pv3 := makePostView("alice.bsky.social", "did:plc:alice", "abc", "no playlist")
	pv3.Embed = &appbsky.FeedDefs_PostView_Embed{
		EmbedVideo_View: &appbsky.EmbedVideo_View{
			Thumbnail: strPtr("https://cdn.bsky.app/thumb@jpg"),
		},
	}
	if vm := extractVideoMeta(pv3, false); vm.URL != "" {
		t.Errorf("video without playlist should produce empty meta, got %+v", vm)
	}
}
