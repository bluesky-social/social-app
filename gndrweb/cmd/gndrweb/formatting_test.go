package main

import (
	"encoding/json"
	"io"
	"os"
	"strings"
	"testing"

	appgndr "github.com/gander-social/gander-indigo-sovereign/api/gndr"
)

func loadPost(t *testing.T, p string) appgndr.FeedPost {

	f, err := os.Open(p)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = f.Close() }()

	postBytes, err := io.ReadAll(f)
	if err != nil {
		t.Fatal(err)
	}
	var post appgndr.FeedPost
	if err := json.Unmarshal(postBytes, &post); err != nil {
		t.Fatal(err)
	}
	return post
}

func TestExpandPostText(t *testing.T) {
	post := loadPost(t, "testdata/atproto_embed_post.json")

	text := ExpandPostText(&post)
	if !strings.Contains(text, "https://github.com/snarfed/bridgy-fed") {
		t.Fail()
	}
}
