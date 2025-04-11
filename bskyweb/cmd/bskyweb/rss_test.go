package main

import (
	"encoding/json"
	"io"
	"os"
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
	enclosure := getPostEnclosure(&p, rec)
	if enclosure == nil {
		t.Fail()
		return

	}
	if enclosure.URL != "https://video.bsky.app/watch/did%3Aplc%3Ad4yzg3vadl536rkihgygkvv6/bafkreidc6rkgxvn642qrwpejspetfynewssxa3wrwenzal7ttm7gug4xzi/playlist.m3u8" {
		t.Fail()
	}
}

func TestImageEmbed(t *testing.T) {
	p := loadFeedViewPost(t, "testdata/atproto_embed_image_view.json")
	rec, ok := p.Post.Record.Val.(*appbsky.FeedPost)
	if !ok {
		t.Fail()
		return
	}
	enclosure := getPostEnclosure(&p, rec)
	if enclosure == nil {
		t.Fail()
		return

	}
	if enclosure.URL != "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:d4yzg3vadl536rkihgygkvv6/bafkreihnsxgc7eizfssvpxafntdrn7k3rewex3xx2mho4k63by5ecc5u24@jpeg" {
		t.Fail()
	}

}
