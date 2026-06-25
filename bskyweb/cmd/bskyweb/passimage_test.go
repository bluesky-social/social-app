package main

import (
	"bytes"
	"image"
	_ "image/png"
	"os"
	"testing"

	"golang.org/x/image/font/basicfont"
)

func TestCompositeStrip_ProducesValidPNG(t *testing.T) {
	baseF, _ := os.Open("testdata/strip-day-base.png")
	defer baseF.Close()
	base, _, err := image.Decode(baseF)
	if err != nil {
		t.Fatalf("base decode: %v", err)
	}
	avF, _ := os.Open("testdata/avatar-test.png")
	defer avF.Close()
	avatar, _, err := image.Decode(avF)
	if err != nil {
		t.Fatalf("avatar decode: %v", err)
	}
	got, err := CompositeStrip(base, avatar, "alice.bsky.social", basicfont.Face7x13)
	if err != nil {
		t.Fatalf("composite: %v", err)
	}
	if len(got) < 100 {
		t.Fatalf("output too small to be valid PNG: %d bytes", len(got))
	}
	if _, _, err := image.Decode(bytes.NewReader(got)); err != nil {
		t.Fatalf("output not a valid PNG: %v", err)
	}
}

func TestCompositeStrip_NilAvatarFallsBack(t *testing.T) {
	baseF, _ := os.Open("testdata/strip-day-base.png")
	defer baseF.Close()
	base, _, _ := image.Decode(baseF)
	got, err := CompositeStrip(base, nil, "alice.bsky.social", basicfont.Face7x13)
	if err != nil {
		t.Fatalf("composite: %v", err)
	}
	if _, _, err := image.Decode(bytes.NewReader(got)); err != nil {
		t.Fatalf("output not a valid PNG: %v", err)
	}
}
