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
// auth in tests.
type Authenticator interface {
	Authenticate(c echo.Context) (did, handle string, err error)
}

// XrpcAuthenticator calls com.atproto.server.getSession with the incoming bearer
// token, verifying the session and returning the (did, handle).
type XrpcAuthenticator struct {
	BaseHost string // e.g. "https://public.api.bsky.app"
}

func (a XrpcAuthenticator) Authenticate(c echo.Context) (string, string, error) {
	hdr := c.Request().Header.Get("Authorization")
	if hdr == "" || !strings.HasPrefix(hdr, "Bearer ") {
		return "", "", errAuthMissing
	}
	jwt := strings.TrimPrefix(hdr, "Bearer ")
	client := &xrpc.Client{
		Host: a.BaseHost,
		Auth: &xrpc.AuthInfo{AccessJwt: jwt},
	}
	resp, err := comatproto.ServerGetSession(c.Request().Context(), client)
	if err != nil {
		return "", "", errAuthMissing
	}
	return resp.Did, resp.Handle, nil
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
	did, _, err := srv.authenticator.Authenticate(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "AuthMissing"})
	}
	var body struct {
		Theme string `json:"theme"`
	}
	_ = json.NewDecoder(c.Request().Body).Decode(&body)
	theme := CoerceTheme(body.Theme)
	tok, err := MintPassToken(srv.cfg.InvitePass.TokenSecret, did, theme, time.Now(), passTokenTTL)
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
	did, tokTheme, err := VerifyPassToken(srv.cfg.InvitePass.TokenSecret, tok, time.Now())
	if err != nil {
		return c.JSON(http.StatusGone, echo.Map{"error": "TokenInvalid"})
	}
	if tokTheme != theme {
		return c.JSON(http.StatusGone, echo.Map{"error": "TokenInvalid"})
	}
	if srv.cfg.InvitePass.Signer == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"error": "SignerDisabled"})
	}

	handle, avatarBytes, err := srv.fetchProfile(c.Request().Context(), did)
	if err != nil {
		return c.JSON(http.StatusBadGateway, echo.Map{"error": "ProfileFetchFailed"})
	}

	passJSON, err := BuildPassJSON(did, handle, theme, srv.cfg.InvitePass.TeamID)
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
	did, handle, err := srv.authenticator.Authenticate(c)
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
	handle, avatarBytes, err := srv.fetchProfile(c.Request().Context(), did)
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

	// Strip is just the per-theme gradient PNG, served as-is. The pass's
	// storeCard primaryFields render the handle below the strip, so painting
	// it again on the image would be redundant. avatarBytes is currently
	// unused; reserved for a future composite that draws the user's avatar.
	_ = avatarBytes
	strip1Bytes, err := readFS(srv.cfg.InvitePass.StripFS, "passes/strip-"+theme+".png")
	if err != nil {
		return nil, fmt.Errorf("strip@1x: %w", err)
	}
	strip2Bytes, _ := readFS(srv.cfg.InvitePass.StripFS, "passes/strip-"+theme+"@2x.png")
	strip3Bytes, _ := readFS(srv.cfg.InvitePass.StripFS, "passes/strip-"+theme+"@3x.png")

	assets := []PassAsset{
		{Name: "icon.png", Data: icon1},
		{Name: "logo.png", Data: logo1},
		{Name: "strip.png", Data: strip1Bytes},
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
	if len(strip2Bytes) > 0 {
		assets = append(assets, PassAsset{Name: "strip@2x.png", Data: strip2Bytes})
	}
	if len(strip3Bytes) > 0 {
		assets = append(assets, PassAsset{Name: "strip@3x.png", Data: strip3Bytes})
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

func (srv *Server) fetchProfile(ctx context.Context, did string) (handle string, avatarBytes []byte, err error) {
	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, did)
	if err != nil {
		return "", nil, err
	}
	handle = pv.Handle
	if pv.Avatar != nil {
		// SSRF defense: only fetch https:// URLs
		if !strings.HasPrefix(*pv.Avatar, "https://") {
			return handle, nil, nil
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
	return handle, avatarBytes, nil
}
