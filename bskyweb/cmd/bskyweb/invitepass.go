package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"io/fs"
	"net/http"
	"net/url"
	"strings"
	"time"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	comatproto "github.com/bluesky-social/indigo/api/atproto"
	"github.com/bluesky-social/indigo/xrpc"
	"github.com/labstack/echo/v4"
	"golang.org/x/image/font"
)

const passTokenTTL = 60 * time.Second
const inviteHeroPath = "/invite/wallet/hero"

var errAuthMissing = errors.New("auth missing")

// Authenticator is satisfied by the production session checker and by stub
// auth in tests. pdsHost is the user's home PDS hostname extracted from the
// DID document service endpoint.
type Authenticator interface {
	Authenticate(c echo.Context) (did, handle, pdsHost string, err error)
}

// XrpcAuthenticator calls com.atproto.server.getSession with the incoming bearer
// token, verifying the session and returning (did, handle, pdsHost).
type XrpcAuthenticator struct {
	BaseHost string // e.g. "https://bsky.social"
}

func (a XrpcAuthenticator) Authenticate(c echo.Context) (string, string, string, error) {
	hdr := c.Request().Header.Get("Authorization")
	if hdr == "" || !strings.HasPrefix(hdr, "Bearer ") {
		return "", "", "", errAuthMissing
	}
	jwt := strings.TrimPrefix(hdr, "Bearer ")
	client := &xrpc.Client{
		Host: a.BaseHost,
		Auth: &xrpc.AuthInfo{AccessJwt: jwt},
	}
	resp, err := comatproto.ServerGetSession(c.Request().Context(), client)
	if err != nil {
		return "", "", "", errAuthMissing
	}
	return resp.Did, resp.Handle, extractPDSHost(resp.DidDoc), nil
}

// extractPDSHost parses the AtprotoPersonalDataServer service entry from the
// DID document returned by getSession and returns just the hostname (no scheme
// or path). Returns "" if absent or unparseable - the caller can fall back to
// a default.
func extractPDSHost(didDoc any) string {
	if didDoc == nil {
		return ""
	}
	raw, err := json.Marshal(didDoc)
	if err != nil {
		return ""
	}
	var doc struct {
		Service []struct {
			Type            string `json:"type"`
			ServiceEndpoint string `json:"serviceEndpoint"`
		} `json:"service"`
	}
	if err := json.Unmarshal(raw, &doc); err != nil {
		return ""
	}
	for _, s := range doc.Service {
		if s.Type != "AtprotoPersonalDataServer" {
			continue
		}
		u, err := url.Parse(s.ServiceEndpoint)
		if err == nil && u.Hostname() != "" {
			return u.Hostname()
		}
	}
	return ""
}

type InvitePassConfig struct {
	TokenSecret []byte
	Signer      *PassSigner
	Wallet      *WalletConfig
	StripFS     fs.FS
	FontFace    font.Face
	TeamID      string
	BaseURL     string // e.g. https://bsky.app
}

func (srv *Server) RegisterInvitePassRoutes() {
	srv.echo.POST("/invite/pass.url", srv.WebInvitePassURL)
	srv.echo.GET("/invite/pass.pkpass", srv.WebInvitePassPkpass)
	srv.echo.GET("/invite/wallet/jwt", srv.WebInviteWalletJWT)
	srv.echo.GET(inviteHeroPath, srv.WebInviteWalletHero)
}

func (srv *Server) WebInvitePassURL(c echo.Context) error {
	if len(srv.cfg.InvitePass.TokenSecret) == 0 {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "InvitePassDisabled"})
	}
	did, _, pdsHost, err := srv.authenticator.Authenticate(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "AuthMissing"})
	}
	var body struct {
		Theme string `json:"theme"`
	}
	_ = json.NewDecoder(c.Request().Body).Decode(&body)
	theme := CoerceTheme(body.Theme)
	tok, err := MintPassToken(srv.cfg.InvitePass.TokenSecret, did, theme, pdsHost, time.Now(), passTokenTTL)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "TokenMintFailed"})
	}
	rawURL := srv.cfg.InvitePass.BaseURL + "/invite/pass.pkpass?theme=" + theme + "&t=" + tok
	return c.JSON(http.StatusOK, echo.Map{"url": rawURL})
}

func (srv *Server) WebInvitePassPkpass(c echo.Context) error {
	if len(srv.cfg.InvitePass.TokenSecret) == 0 {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "InvitePassDisabled"})
	}
	theme := CoerceTheme(c.QueryParam("theme"))
	tok := c.QueryParam("t")
	did, tokTheme, pdsHost, err := VerifyPassToken(srv.cfg.InvitePass.TokenSecret, tok, time.Now())
	if err != nil {
		return c.JSON(http.StatusGone, echo.Map{"error": "TokenInvalid"})
	}
	if tokTheme != theme {
		return c.JSON(http.StatusGone, echo.Map{"error": "TokenInvalid"})
	}
	if srv.cfg.InvitePass.Signer == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "SignerDisabled"})
	}

	handle, displayName, createdAt, avatarBytes, err := srv.fetchProfile(c.Request().Context(), did)
	if err != nil {
		return c.JSON(http.StatusBadGateway, echo.Map{"error": "ProfileFetchFailed"})
	}

	passJSON, err := BuildPassJSON(did, handle, displayName, pdsHost, theme, srv.cfg.InvitePass.TeamID, createdAt)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "PassBuildFailed"})
	}

	assets, err := srv.buildPassAssets(theme, handle, avatarBytes)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "AssetBuildFailed"})
	}

	pkpass, err := SignAndZipPass(passJSON, assets, srv.cfg.InvitePass.Signer)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "SignFailed"})
	}

	c.Response().Header().Set("Content-Type", "application/vnd.apple.pkpass")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=bsky-invite.pkpass")
	c.Response().Header().Set("Cache-Control", "no-store")
	_, err = c.Response().Write(pkpass)
	return err
}

func (srv *Server) WebInviteWalletJWT(c echo.Context) error {
	did, handle, _, err := srv.authenticator.Authenticate(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "AuthMissing"})
	}
	theme := CoerceTheme(c.QueryParam("theme"))
	if srv.cfg.InvitePass.Wallet == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "GoogleWalletDisabled"})
	}
	jwt, err := BuildSaveJWT(srv.cfg.InvitePass.Wallet, did, handle, theme)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "JWTBuildFailed"})
	}
	return c.JSON(http.StatusOK, echo.Map{"jwt": jwt})
}

// WebInviteWalletHero renders a hero image for Google Wallet. Unauthenticated by
// design - Google fetches this image from their renderer. The DID + theme combo
// is unguessable and the data exposed (avatar + handle, both public) is already
// on the user's profile.
func (srv *Server) WebInviteWalletHero(c echo.Context) error {
	did := c.QueryParam("did")
	theme := CoerceTheme(c.QueryParam("theme"))
	if did == "" {
		return c.NoContent(http.StatusBadRequest)
	}
	handle, _, _, avatarBytes, err := srv.fetchProfile(c.Request().Context(), did)
	if err != nil {
		return c.JSON(http.StatusBadGateway, echo.Map{"error": "ProfileFetchFailed"})
	}
	base, err := LoadGradientBase(srv.cfg.InvitePass.StripFS, theme, 2)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "StripLoadFailed"})
	}
	avatarImg, _ := decodeImage(avatarBytes)
	out, err := CompositeStrip(base, avatarImg, handle, srv.cfg.InvitePass.FontFace)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "StripBuildFailed"})
	}
	c.Response().Header().Set("Content-Type", "image/png")
	c.Response().Header().Set("Cache-Control", "public, max-age=86400")
	_, err = c.Response().Write(out)
	return err
}

func (srv *Server) buildPassAssets(theme, handle string, avatarBytes []byte) ([]PassAsset, error) {
	icon1, err := readFS(srv.cfg.InvitePass.StripFS, "passes/"+theme+"/icon.png")
	if err != nil {
		return nil, fmt.Errorf("icon: %w", err)
	}
	icon2, _ := readFS(srv.cfg.InvitePass.StripFS, "passes/"+theme+"/icon@2x.png")
	icon3, _ := readFS(srv.cfg.InvitePass.StripFS, "passes/"+theme+"/icon@3x.png")
	logo1, err := readFS(srv.cfg.InvitePass.StripFS, "passes/logo.png")
	if err != nil {
		return nil, fmt.Errorf("logo: %w", err)
	}
	logo2, _ := readFS(srv.cfg.InvitePass.StripFS, "passes/logo@2x.png")
	logo3, _ := readFS(srv.cfg.InvitePass.StripFS, "passes/logo@3x.png")

	// iOS 27 posterGeneric assets - shared across themes (no theme-specific
	// variants yet). primaryLogo is the big butterfly to the right; background
	// is the full-bleed dark navy. Optional - if missing, Wallet falls back to
	// the iOS <= 26 generic layout that doesn't reference them.
	primaryLogo2, _ := readFS(srv.cfg.InvitePass.StripFS, "passes/primaryLogo@2x.png")
	primaryLogo3, _ := readFS(srv.cfg.InvitePass.StripFS, "passes/primaryLogo@3x.png")
	background2, _ := readFS(srv.cfg.InvitePass.StripFS, "passes/background@2x.png")
	background3, _ := readFS(srv.cfg.InvitePass.StripFS, "passes/background@3x.png")

	// avatarBytes is currently unused on this pass design; reserved for a
	// future thumbnail composite.
	_ = avatarBytes

	assets := []PassAsset{
		{Name: "icon.png", Data: icon1},
		{Name: "logo.png", Data: logo1},
	}
	if len(icon2) > 0 {
		assets = append(assets, PassAsset{Name: "icon@2x.png", Data: icon2})
	}
	if len(icon3) > 0 {
		assets = append(assets, PassAsset{Name: "icon@3x.png", Data: icon3})
	}
	if len(logo2) > 0 {
		assets = append(assets, PassAsset{Name: "logo@2x.png", Data: logo2})
	}
	if len(logo3) > 0 {
		assets = append(assets, PassAsset{Name: "logo@3x.png", Data: logo3})
	}
	if len(primaryLogo2) > 0 {
		assets = append(assets, PassAsset{Name: "primaryLogo@2x.png", Data: primaryLogo2})
	}
	if len(primaryLogo3) > 0 {
		assets = append(assets, PassAsset{Name: "primaryLogo@3x.png", Data: primaryLogo3})
	}
	if len(background2) > 0 {
		assets = append(assets, PassAsset{Name: "background@2x.png", Data: background2})
	}
	if len(background3) > 0 {
		assets = append(assets, PassAsset{Name: "background@3x.png", Data: background3})
	}
	return assets, nil
}

func buildStripAtDensity(staticFS fs.FS, theme string, scale int, avatar image.Image, handle string, fontFace font.Face) ([]byte, error) {
	base, err := LoadGradientBase(staticFS, theme, scale)
	if err != nil {
		return nil, err
	}
	return CompositeStrip(base, avatar, handle, fontFace)
}

func readFS(staticFS fs.FS, name string) ([]byte, error) {
	f, err := staticFS.Open(name)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return io.ReadAll(f)
}

func decodeImage(data []byte) (image.Image, error) {
	if len(data) == 0 {
		return nil, errors.New("empty")
	}
	img, _, err := image.Decode(bytes.NewReader(data))
	return img, err
}

func (srv *Server) fetchProfile(ctx context.Context, did string) (handle, displayName string, createdAt time.Time, avatarBytes []byte, err error) {
	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, did)
	if err != nil {
		return "", "", time.Time{}, nil, err
	}
	handle = pv.Handle
	if pv.DisplayName != nil {
		displayName = *pv.DisplayName
	}
	// CreatedAt is when the profile record was written, which is usually within
	// seconds of account creation - close enough for a "member since" display.
	// Fall back to IndexedAt if CreatedAt is missing (older profiles).
	if pv.CreatedAt != nil {
		if t, terr := time.Parse(time.RFC3339, *pv.CreatedAt); terr == nil {
			createdAt = t
		}
	}
	if createdAt.IsZero() && pv.IndexedAt != nil {
		if t, terr := time.Parse(time.RFC3339, *pv.IndexedAt); terr == nil {
			createdAt = t
		}
	}
	if pv.Avatar != nil {
		// SSRF defense: only fetch https:// URLs
		if !strings.HasPrefix(*pv.Avatar, "https://") {
			return handle, displayName, createdAt, nil, nil
		}
		req, _ := http.NewRequestWithContext(ctx, http.MethodGet, *pv.Avatar, nil)
		client := &http.Client{Timeout: 5 * time.Second}
		resp, herr := client.Do(req)
		if herr == nil {
			defer resp.Body.Close()
			if resp.StatusCode == 200 {
				avatarBytes, _ = io.ReadAll(io.LimitReader(resp.Body, 1024*1024))
			}
		}
	}
	return handle, displayName, createdAt, avatarBytes, nil
}
