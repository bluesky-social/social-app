package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
)

// stubAuth replaces the real ServerGetSession check; bound DID is returned to the handler.
type stubAuth struct{ did, handle string }

func (s stubAuth) Authenticate(c echo.Context) (did, handle string, err error) {
	if c.Request().Header.Get("Authorization") == "" {
		return "", "", errAuthMissing
	}
	return s.did, s.handle, nil
}

func newTestServer(t *testing.T) (*Server, *stubAuth) {
	t.Helper()
	cert, key, wwdr := genTestCertChain(t)
	signer := &PassSigner{Cert: cert, Key: key, WWDR: wwdr}
	authStub := &stubAuth{did: "did:plc:abc", handle: "alice.bsky.social"}
	srv := &Server{
		echo: echo.New(),
		cfg: &Config{
			InvitePass: InvitePassConfig{
				TokenSecret: []byte("test-secret-32-bytes-of-random!!"),
				Signer:      signer,
				Wallet:      nil, // skip google in this test
			},
		},
		authenticator: authStub,
	}
	srv.RegisterInvitePassRoutes()
	return srv, authStub
}

func TestWebInvitePassURL_Unauthorized(t *testing.T) {
	srv, _ := newTestServer(t)
	req := httptest.NewRequest(http.MethodPost, "/invite/pass.url", bytes.NewReader([]byte(`{"theme":"dusk"}`)))
	rec := httptest.NewRecorder()
	srv.echo.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d", rec.Code)
	}
}

func TestWebInvitePassURL_OK(t *testing.T) {
	srv, _ := newTestServer(t)
	req := httptest.NewRequest(http.MethodPost, "/invite/pass.url", bytes.NewReader([]byte(`{"theme":"dusk"}`)))
	req.Header.Set("Authorization", "Bearer fake")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.echo.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d body = %s", rec.Code, rec.Body.String())
	}
	var body struct{ URL string }
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	if !strings.Contains(body.URL, "/invite/pass.pkpass?theme=dusk&t=") {
		t.Fatalf("unexpected url: %s", body.URL)
	}
}

func TestWebInvitePassPkpass_TokenExpired(t *testing.T) {
	srv, _ := newTestServer(t)
	expiredTok, _ := MintPassToken(srv.cfg.InvitePass.TokenSecret, "did:plc:abc", "dusk",
		time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), 60*time.Second)
	req := httptest.NewRequest(http.MethodGet, "/invite/pass.pkpass?theme=dusk&t="+expiredTok, nil)
	rec := httptest.NewRecorder()
	srv.echo.ServeHTTP(rec, req)
	if rec.Code != http.StatusGone {
		t.Fatalf("status = %d", rec.Code)
	}
}

func TestWebInvitePassPkpass_ThemeMismatchInToken(t *testing.T) {
	srv, _ := newTestServer(t)
	tok, _ := MintPassToken(srv.cfg.InvitePass.TokenSecret, "did:plc:abc", "day", time.Now(), 60*time.Second)
	req := httptest.NewRequest(http.MethodGet, "/invite/pass.pkpass?theme=dusk&t="+tok, nil)
	rec := httptest.NewRecorder()
	srv.echo.ServeHTTP(rec, req)
	if rec.Code != http.StatusGone {
		t.Fatalf("status = %d", rec.Code)
	}
}
