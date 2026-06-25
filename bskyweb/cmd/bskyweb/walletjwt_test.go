package main

import (
	"crypto/rand"
	"crypto/rsa"
	"strings"
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func TestBuildSaveJWT_RoundTrip(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	cfg := &WalletConfig{
		IssuerEmail: "issuer@example.com",
		IssuerID:    "3388000000000000000",
		PrivateKey:  key,
		HeroBaseURL: "https://bsky.app/invite/wallet/hero",
		LogoURL:     "https://web-cdn.bsky.app/passes/logo.png",
	}

	tok, err := BuildSaveJWT(cfg, "did:plc:abc", "alice.bsky.social", "dusk")
	if err != nil {
		t.Fatalf("build: %v", err)
	}

	parsed, err := jwt.Parse(tok, func(t *jwt.Token) (any, error) {
		return &key.PublicKey, nil
	})
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	claims := parsed.Claims.(jwt.MapClaims)
	if claims["iss"] != "issuer@example.com" {
		t.Errorf("iss = %v", claims["iss"])
	}
	if claims["aud"] != "google" {
		t.Errorf("aud = %v", claims["aud"])
	}
	if claims["typ"] != "savetowallet" {
		t.Errorf("typ = %v", claims["typ"])
	}
	payload := claims["payload"].(map[string]any)
	objs := payload["genericObjects"].([]any)
	if len(objs) != 1 {
		t.Fatalf("want 1 object, got %d", len(objs))
	}
	obj := objs[0].(map[string]any)
	if !strings.HasSuffix(obj["id"].(string), ".bsky-did_plc_abc-dusk") {
		t.Errorf("unexpected id: %v", obj["id"])
	}
	if obj["hexBackgroundColor"] != "#b15aa2" {
		t.Errorf("hexBackgroundColor = %v", obj["hexBackgroundColor"])
	}
	barcode := obj["barcode"].(map[string]any)
	if barcode["value"] != "https://bsky.app/profile/alice.bsky.social" {
		t.Errorf("barcode.value = %v", barcode["value"])
	}
}

func TestBuildSaveJWT_ThemeCoerced(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	cfg := &WalletConfig{IssuerEmail: "x", IssuerID: "Y", PrivateKey: key}
	tok, err := BuildSaveJWT(cfg, "did:plc:abc", "alice.bsky.social", "GARBAGE")
	if err != nil {
		t.Fatalf("build: %v", err)
	}
	parsed, _ := jwt.Parse(tok, func(t *jwt.Token) (any, error) { return &key.PublicKey, nil })
	obj := parsed.Claims.(jwt.MapClaims)["payload"].(map[string]any)["genericObjects"].([]any)[0].(map[string]any)
	if !strings.HasSuffix(obj["id"].(string), "-day") {
		t.Errorf("expected coercion to day, got id %v", obj["id"])
	}
}

func TestBuildSaveJWT_IdSanitizesDidColons(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	cfg := &WalletConfig{
		IssuerEmail: "issuer@example.com",
		IssuerID:    "3388000000000000000",
		PrivateKey:  key,
		HeroBaseURL: "https://bsky.app/invite/wallet/hero",
		LogoURL:     "https://web-cdn.bsky.app/passes/logo.png",
	}

	tok, err := BuildSaveJWT(cfg, "did:plc:abc123", "alice.bsky.social", "day")
	if err != nil {
		t.Fatalf("build: %v", err)
	}

	parsed, err := jwt.Parse(tok, func(t *jwt.Token) (any, error) {
		return &key.PublicKey, nil
	})
	if err != nil {
		t.Fatalf("parse: %v", err)
	}

	claims := parsed.Claims.(jwt.MapClaims)
	payload := claims["payload"].(map[string]any)
	objs := payload["genericObjects"].([]any)
	if len(objs) != 1 {
		t.Fatalf("want 1 object, got %d", len(objs))
	}
	obj := objs[0].(map[string]any)

	// Assert that the id ends with the sanitized DID (colons replaced with underscores)
	if !strings.HasSuffix(obj["id"].(string), ".bsky-did_plc_abc123-day") {
		t.Errorf("expected id to end with .bsky-did_plc_abc123-day, got %v", obj["id"])
	}

	// Assert that the barcode value still contains the original profile URL
	barcode := obj["barcode"].(map[string]any)
	if barcode["value"] != "https://bsky.app/profile/alice.bsky.social" {
		t.Errorf("expected barcode.value to be unchanged, got %v", barcode["value"])
	}
}
