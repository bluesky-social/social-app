package main

import (
	"context"
	"errors"
	"net"
	"net/http"
	"time"

	"github.com/bluesky-social/gttp"
	"github.com/bluesky-social/indigo/atproto/identity"
)

// errHandleRedirect is returned when a well-known lookup tries to redirect.
var errHandleRedirect = errors.New("handle resolution refused to follow a redirect")

const (
	handleResolveTimeout = 5 * time.Second
	handleCacheCapacity  = 10_000
)

// newHandleHTTPClient returns the client used to resolve a handle named in an
// oEmbed URL: strict SSRF policy, no redirects, bounded time and body.
func newHandleHTTPClient() *http.Client {
	return gttp.New(
		gttp.WithTimeout(handleResolveTimeout),
		gttp.WithDialTimeout(handleResolveTimeout),
		gttp.WithResponseHeaderTimeout(handleResolveTimeout),
		gttp.WithNoRedirects(),
		gttp.WithNoRetries(),
		gttp.WithNoProxy(),
		gttp.WithStrictSSRFProtection(),
		gttp.WithMaxResponseBodyBytes(4096),
	)
}

// newIdentityDirectory is identity.DefaultDirectory() with the client above, no
// authoritative DNS fallback and a smaller cache.
func newIdentityDirectory() *identity.CacheDirectory {
	base := &identity.BaseDirectory{
		PLCURL:     identity.DefaultPLCURL,
		HTTPClient: *newHandleHTTPClient(),
		Resolver: net.Resolver{
			Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
				d := net.Dialer{Timeout: 3 * time.Second}
				return d.DialContext(ctx, network, address)
			},
		},
		// Indigo dials the handle domain's nameserver when this is on.
		TryAuthoritativeDNS:   false,
		SkipDNSDomainSuffixes: []string{".bsky.social"},
	}
	return identity.NewCacheDirectory(base, handleCacheCapacity, 24*time.Hour, 2*time.Minute, 5*time.Minute)
}

// isHandleResolutionError reports whether err came from resolving a handle. Those
// carry dial addresses and resolver details, so they are logged, not returned.
func isHandleResolutionError(err error) bool {
	for _, target := range []error{
		identity.ErrHandleResolutionFailed,
		identity.ErrHandleNotFound,
		identity.ErrHandleMismatch,
		identity.ErrHandleNotDeclared,
		identity.ErrHandleReservedTLD,
		identity.ErrDIDResolutionFailed,
		identity.ErrDIDNotFound,
		errHandleRedirect,
		gttp.ErrBlockedByIPPolicy,
	} {
		if errors.Is(err, target) {
			return true
		}
	}
	return false
}
