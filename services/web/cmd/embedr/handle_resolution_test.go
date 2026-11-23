package main

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/bluesky-social/gttp"
)

func TestHandleHTTPClientRefusesRedirects(t *testing.T) {
	client := newHandleHTTPClient()
	if client.CheckRedirect == nil {
		t.Fatalf("expected a redirect policy")
	}
	req, err := http.NewRequest(http.MethodGet, "http://169.254.169.254/latest/meta-data/", nil)
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	prev, _ := http.NewRequest(http.MethodGet, "https://handle.example/.well-known/atproto-did", nil)
	if err := client.CheckRedirect(req, []*http.Request{prev}); err == nil {
		t.Fatalf("expected the redirect to be refused")
	}
}

func TestHandleHTTPClientBlocksInternalAddresses(t *testing.T) {
	client := newHandleHTTPClient()
	for _, target := range []string{
		"http://127.0.0.1/.well-known/atproto-did",
		"http://169.254.169.254/latest/meta-data/",
		"http://10.0.0.1/.well-known/atproto-did",
		"http://[::1]/.well-known/atproto-did",
		"http://100.100.100.200/.well-known/atproto-did",
	} {
		req, err := http.NewRequest(http.MethodGet, target, nil)
		if err != nil {
			t.Fatalf("%s: %v", target, err)
		}
		if _, err := client.Do(req.WithContext(context.Background())); err == nil {
			t.Errorf("%s was not blocked", target)
			continue
		} else if !errors.Is(err, gttp.ErrBlockedByIPPolicy) {
			t.Errorf("%s: expected an IP policy block, got %v", target, err)
		}
	}
}

func TestResolutionErrorsAreNotReturned(t *testing.T) {
	if !isHandleResolutionError(gttp.ErrBlockedByIPPolicy) {
		t.Errorf("IP policy blocks should be treated as resolution failures")
	}
	if !isHandleResolutionError(errHandleRedirect) {
		t.Errorf("redirect refusals should be treated as resolution failures")
	}
}
