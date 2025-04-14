package main

import (
	"encoding/json"
	"io"
	"os"
	"strings"
	"testing"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

func loadFeedViewPost(t *testing.T, p string) appbsky.FeedDefs_FeedViewPost {

	f, err := os.Open(p)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = f.Close() }()

	postBytes, err := io.ReadAll(f)
	if err != nil {
		t.Fatal(err)
	}
	var post appbsky.FeedDefs_FeedViewPost
	if err := json.Unmarshal(postBytes, &post); err != nil {
		t.Fatal(err)
	}
	return post
}

func TestVideoEmbed(t *testing.T) {
	p := loadFeedViewPost(t, "testdata/atproto_embed_video_view.json")
	rec, ok := p.Post.Record.Val.(*appbsky.FeedPost)
	if !ok {
		t.Fail()
		return
	}
	mediaContents := getPostMediaContents(&p, rec)
	if len(mediaContents) == 0 {
		t.Fatal("Expected media contents for video embed, but got none")
	}

	if mediaContents[0].URL != "https://video.bsky.app/watch/did%3Aplc%3Ad4yzg3vadl536rkihgygkvv6/bafkreidc6rkgxvn642qrwpejspetfynewssxa3wrwenzal7ttm7gug4xzi/playlist.m3u8" {
		t.Fatalf("Expected specific URL but got: %s", mediaContents[0].URL)
	}
}

func TestImageEmbed(t *testing.T) {
	p := loadFeedViewPost(t, "testdata/atproto_embed_image_view.json")
	rec, ok := p.Post.Record.Val.(*appbsky.FeedPost)
	if !ok {
		t.Fail()
		return
	}
	mediaContents := getPostMediaContents(&p, rec)
	if len(mediaContents) == 0 {
		t.Fatal("Expected media contents for image embed, but got none")
	}

	// test that there are 4 images
	if len(mediaContents) != 4 {
		t.Fatalf("Expected 4 media contents but got: %d", len(mediaContents))
	}

	// test that each media content is constructed correctly
	for i, mediaContent := range mediaContents {
		// inspect the `record` field of the post and verify things look correct
		if !strings.Contains(mediaContent.URL, rec.Embed.EmbedImages.Images[i].Image.Ref.String()) {
			t.Fatalf("Expected specific URL but got: %s", mediaContent.URL)
		}
		if mediaContent.Type != "image/jpeg" {
			t.Fatalf("Expected media content type to be 'image/jpeg' but got: %s", mediaContent.Type)
		}

		if mediaContent.FileSize != rec.Embed.EmbedImages.Images[i].Image.Size {
			t.Fatalf("Expected media content file size to be %d but got: %d", rec.Embed.EmbedImages.Images[i].Image.Size, mediaContent.FileSize)
		}
	}
}

func TestVideoEmbedWithEmbedVideo(t *testing.T) {
	p := loadFeedViewPost(t, "testdata/atproto_embed_video_with_embed_video.json")
	rec, ok := p.Post.Record.Val.(*appbsky.FeedPost)
	if !ok {
		t.Fail()
		return
	}
	mediaContents := getPostMediaContents(&p, rec)
	if len(mediaContents) != 1 {
		t.Fatal("Expected media contents for 1 video embed, but got none")
	}

	if mediaContents[0].URL != "https://video.bsky.app/watch/did%3Aplc%3Ad4yzg3vadl536rkihgygkvv6/bafkreifln2xsbd5e4p76ey5vlwxr4ubkmoiacdmev2fjbggu3i33ysqyla/playlist.m3u8" {
		t.Fatalf("Expected specific URL but got: %s", mediaContents[0].URL)
	}
}
