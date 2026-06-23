package main

import (
	"strings"

	"github.com/labstack/echo/v4"
)

// Brand carries the per-brand identity that the SSR layer needs to inject
// into OG / Twitter Card metadata. The runtime web bundle resolves its own
// brand from window.location.hostname (src/brand/resolve.web.ts); this is
// the server-side mirror used by the Pongo2 templates.
//
// Field names are exported because Pongo2 reads them via Go reflection.
type Brand struct {
	ID             string
	Name           string
	SiteName       string
	Description    string
	TwitterHandle  string
	DefaultOGImage string
	AppleItunesApp string
	CanonicalHost  string

	// Pre-hydration splash styling. These let the SSR shell paint the
	// correct brand background before the JS bundle loads, so a first-time
	// visitor to a branded host does not see the default-brand background.
	// The values mirror the brand palettes consumed by src/alf/themes.ts:
	// BgLight is palette.default.contrast_0, BgDark/BgDim are the inverted
	// contrast_1000 of the (dark) default/subdued ramps (see src/brand/boot.ts).
	BgLight      string
	BgDark       string
	BgDim        string
	PrimaryColor string
}

const brandContextKey = "brand"

var brands = map[string]Brand{
	"bluesky": {
		ID:             "bluesky",
		Name:           "Bluesky",
		SiteName:       "Bluesky Social",
		Description:    "Social media as it should be. Find your community among millions of users, unleash your creativity, and have some fun again.",
		TwitterHandle:  "@bluesky",
		DefaultOGImage: "https://bsky.app/static/social-card-default-gradient.png",
		AppleItunesApp: "app-id=xyz.blueskyweb.app, app-clip-bundle-id=xyz.blueskyweb.app.AppClip, app-clip-display=card",
		CanonicalHost:  "bsky.app",
		BgLight:        "#FFFFFF",
		BgDark:         "#000000",
		BgDim:          "#151D28",
		PrimaryColor:   "#006AFF",
	},
	"k4m2a": {
		ID:            "k4m2a",
		Name:          "k4m2a",
		SiteName:      "k4m2a",
		Description:   "Join the conversation on k4m2a.",
		CanonicalHost: "k4m2a.app",
		BgLight:       "#FFFFFF",
		BgDark:        "#0D0D0D",
		BgDim:         "#121212",
		PrimaryColor:  "#000000",
	},
	"mdparivaar": {
		ID:            "mdparivaar",
		Name:          "MDParivaar",
		SiteName:      "MDParivaar",
		Description:   "Madhyasth Darshan community on MDParivaar.",
		CanonicalHost: "mdparivaar.com",
		BgLight:       "#FFFFFF",
		BgDark:        "#150D0A",
		BgDim:         "#1E1410",
		PrimaryColor:  "#CD7233",
	},
	"coseeker": {
		ID:            "coseeker",
		Name:          "CoSeeker",
		SiteName:      "CoSeeker",
		Description:   "Join the conversation on CoSeeker.",
		CanonicalHost: "coseeker.com",
		BgLight:       "#FFFFFF",
		BgDark:        "#0D0D0D",
		BgDim:         "#121212",
		PrimaryColor:  "#000000",
	},
}

// hostnameToBrandID mirrors src/brand/resolve.web.ts. Add entries as
// production hostnames come online. Anything not listed falls back to
// the default brand.
var hostnameToBrandID = map[string]string{
	"k4m2a.app":          "k4m2a",
	"www.k4m2a.app":      "k4m2a",
	"mdparivaar.com":     "mdparivaar",
	"www.mdparivaar.com": "mdparivaar",
	"coseeker.com":       "coseeker",
	"www.coseeker.com":   "coseeker",
}

const defaultBrandID = "bluesky"

// ResolveBrand picks a brand from a Host header. Strips the port,
// lowercases, and falls back to the default brand on unknown hosts.
func ResolveBrand(host string) Brand {
	host = strings.ToLower(host)
	if i := strings.IndexByte(host, ':'); i >= 0 {
		host = host[:i]
	}
	id, ok := hostnameToBrandID[host]
	if !ok {
		id = defaultBrandID
	}
	b, ok := brands[id]
	if !ok {
		b = brands[defaultBrandID]
	}
	return b
}

// BrandMiddleware resolves the brand once per request from the Host
// header and stashes it on the echo context so handlers can read it
// via brandFromContext() without re-parsing.
func BrandMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set(brandContextKey, ResolveBrand(c.Request().Host))
			return next(c)
		}
	}
}

// brandFromContext returns the brand attached by BrandMiddleware, or the
// default brand if the middleware didn't run (e.g. error paths before
// routing).
func brandFromContext(c echo.Context) Brand {
	if c == nil {
		return brands[defaultBrandID]
	}
	if b, ok := c.Get(brandContextKey).(Brand); ok {
		return b
	}
	if req := c.Request(); req != nil {
		return ResolveBrand(req.Host)
	}
	return brands[defaultBrandID]
}
