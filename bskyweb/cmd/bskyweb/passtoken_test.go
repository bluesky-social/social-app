// bskyweb/cmd/bskyweb/passtoken_test.go
package main

import (
	"errors"
	"testing"
	"time"
)

func TestPassToken_RoundTrip(t *testing.T) {
	secret := []byte("test-secret-32-bytes-of-random!!")
	now := time.Date(2026, 6, 25, 12, 0, 0, 0, time.UTC)
	tok, err := MintPassToken(secret, "did:plc:abc", "dusk", now, 60*time.Second)
	if err != nil {
		t.Fatalf("mint: %v", err)
	}
	gotDid, gotTheme, err := VerifyPassToken(secret, tok, now.Add(10*time.Second))
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if gotDid != "did:plc:abc" || gotTheme != "dusk" {
		t.Fatalf("mismatch: %q %q", gotDid, gotTheme)
	}
}

func TestPassToken_Expired(t *testing.T) {
	secret := []byte("test-secret-32-bytes-of-random!!")
	now := time.Date(2026, 6, 25, 12, 0, 0, 0, time.UTC)
	tok, _ := MintPassToken(secret, "did:plc:abc", "day", now, 60*time.Second)
	_, _, err := VerifyPassToken(secret, tok, now.Add(61*time.Second))
	if !errors.Is(err, ErrTokenExpired) {
		t.Fatalf("want ErrTokenExpired, got %v", err)
	}
}

func TestPassToken_BadSignature(t *testing.T) {
	secretA := []byte("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	secretB := []byte("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
	now := time.Date(2026, 6, 25, 12, 0, 0, 0, time.UTC)
	tok, _ := MintPassToken(secretA, "did:plc:abc", "day", now, 60*time.Second)
	_, _, err := VerifyPassToken(secretB, tok, now)
	if !errors.Is(err, ErrTokenInvalid) {
		t.Fatalf("want ErrTokenInvalid, got %v", err)
	}
}

func TestPassToken_Mutated(t *testing.T) {
	secret := []byte("test-secret-32-bytes-of-random!!")
	now := time.Date(2026, 6, 25, 12, 0, 0, 0, time.UTC)
	tok, _ := MintPassToken(secret, "did:plc:abc", "day", now, 60*time.Second)
	// flip a byte in the middle of the payload portion
	mutated := []byte(tok)
	mutated[10] ^= 0x01
	_, _, err := VerifyPassToken(secret, string(mutated), now)
	if !errors.Is(err, ErrTokenInvalid) {
		t.Fatalf("want ErrTokenInvalid, got %v", err)
	}
}
