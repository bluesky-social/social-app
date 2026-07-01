package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"sync"
	"time"
)

// BrandConfig holds all brand-specific values that are passed to pongo2 templates.
type BrandConfig struct {
	Name           string
	ThemeColor     string
	Domain         string
	Shortlink      string
	Title          string
	Description    string
	PrimaryCTA     string
	TwitterSite    string
	BgLight        string
	BgDark         string
	BgDim          string
	SelectionLight string
	SelectionDark  string
	BrandHue       string

	// Asset URLs from computed.assets (Brand Config API only).
	// Empty means "use the static CDN default".
	Favicon    string
	Logo       string
	LogoDark   string
	LogoLight  string
	SocialCard string
}

// DefaultBrandConfig returns Blacksky defaults for all brand values.
func DefaultBrandConfig() BrandConfig {
	return BrandConfig{
		Name:           "Blacksky",
		ThemeColor:     "#6060E9",
		Domain:         "https://blacksky.community",
		Shortlink:      "https://go.blacksky.community",
		Title:          "Blacksky",
		Description:    "Decentralized social media built for community power, culture, and collective freedom.",
		PrimaryCTA:     "Join the cookout",
		TwitterSite:    "@blacksky",
		BgLight:        "#F8FAF9",
		BgDark:         "#070C0C",
		BgDim:          "#161E27",
		SelectionLight: "#D2FC51",
		SelectionDark:  "#464985",
		BrandHue:       "240",
	}
}

// communityConfigJSON mirrors the subset of the **raw** community config JSON
// used by LoadBrandConfig for local-file mode (no API). When the brand config
// API is configured, this struct is unused — the server reads from the computed
// config returned by the API instead (see mapAPIResponseToBrandConfig).
type communityConfigJSON struct {
	Metadata struct {
		Name        string `json:"name"`
		DisplayName string `json:"displayName"`
		Description string `json:"description"`
	} `json:"metadata"`
	Branding struct {
		Messages struct {
			PrimaryCTA string `json:"primaryCTA"`
		} `json:"messages"`
	} `json:"branding"`
	Web struct {
		ThemeColor string `json:"themeColor"`
		Title      string `json:"title"`
		Domains    struct {
			Main      string `json:"main"`
			Shortlink string `json:"shortlink"`
		} `json:"domains"`
	} `json:"web"`
}

// LoadBrandConfig reads the community config JSON and extracts brand values,
// falling back to defaults for any missing field.
func LoadBrandConfig(path string) BrandConfig {
	cfg := DefaultBrandConfig()

	if path == "" {
		return cfg
	}

	data, err := os.ReadFile(path)
	if err != nil {
		log.Warnf("failed to read brand config %s: %v, using defaults", path, err)
		return cfg
	}

	var raw communityConfigJSON
	if err := json.Unmarshal(data, &raw); err != nil {
		log.Warnf("failed to parse brand config %s: %v, using defaults", path, err)
		return cfg
	}

	if raw.Metadata.DisplayName != "" {
		cfg.Name = raw.Metadata.DisplayName
	} else if raw.Metadata.Name != "" {
		cfg.Name = raw.Metadata.Name
	}

	if raw.Web.ThemeColor != "" {
		cfg.ThemeColor = raw.Web.ThemeColor
	}

	if raw.Web.Domains.Main != "" {
		cfg.Domain = raw.Web.Domains.Main
	}

	if raw.Web.Domains.Shortlink != "" {
		cfg.Shortlink = raw.Web.Domains.Shortlink
	}

	if raw.Web.Title != "" {
		cfg.Title = raw.Web.Title
	} else if raw.Metadata.DisplayName != "" {
		cfg.Title = raw.Metadata.DisplayName
	}

	if raw.Metadata.Description != "" {
		cfg.Description = raw.Metadata.Description
	}

	if raw.Branding.Messages.PrimaryCTA != "" {
		cfg.PrimaryCTA = raw.Branding.Messages.PrimaryCTA
	}

	// TwitterSite, BgLight, BgDark, BgDim, SelectionLight, SelectionDark, BrandHue
	// are not in the community config JSON — they stay at defaults.
	// These CSS values are computed by the React frontend's configGenerator and
	// injected at runtime; the server-side defaults match the Blacksky brand.

	return cfg
}

// ---------------------------------------------------------------------------
// BrandConfigClient — HTTP client with in-memory caching for the Brand Config API
// ---------------------------------------------------------------------------

// brandAPIResponse mirrors the shape returned by GET /brands/:slug.
type brandAPIResponse struct {
	Slug     string          `json:"slug"`
	Status   string          `json:"status"`
	Computed json.RawMessage `json:"computed"`
}

// cachedBrand holds a cached brand config alongside the raw computed JSON and
// the time it was fetched.
type cachedBrand struct {
	config    BrandConfig
	computed  json.RawMessage
	fetchedAt time.Time
	negative  bool // true if this is a cached miss (404/error)
}

// BrandConfigClient fetches brand configs from the Brand Config API and caches
// them in memory with a configurable TTL.
type BrandConfigClient struct {
	apiBase string
	ttl     time.Duration
	maxSize int
	client  *http.Client

	mu    sync.RWMutex
	cache map[string]*cachedBrand
	order []string // insertion order for LRU eviction
}

// NewBrandConfigClient creates a BrandConfigClient that fetches from apiBase
// (e.g. "http://localhost:4800") and caches results for ttl.
func NewBrandConfigClient(apiBase string, ttl time.Duration) *BrandConfigClient {
	return NewBrandConfigClientWithMaxSize(apiBase, ttl, 10000)
}

// NewBrandConfigClientWithMaxSize creates a BrandConfigClient with a custom
// maximum cache size. When the cache reaches maxSize, the oldest entry is evicted.
func NewBrandConfigClientWithMaxSize(apiBase string, ttl time.Duration, maxSize int) *BrandConfigClient {
	return &BrandConfigClient{
		apiBase: apiBase,
		ttl:     ttl,
		maxSize: maxSize,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
		cache: make(map[string]*cachedBrand),
	}
}

// FetchBrand returns the BrandConfig and raw computed JSON for the given host.
// It returns from cache if the entry is still fresh; otherwise it fetches from
// the API, caches the result, and returns it. On error it falls back to a stale
// cache entry or defaults.
func (bc *BrandConfigClient) FetchBrand(host string) (BrandConfig, json.RawMessage, error) {
	bc.mu.RLock()
	entry, ok := bc.cache[host]
	bc.mu.RUnlock()

	if ok && time.Since(entry.fetchedAt) < bc.ttl {
		return entry.config, entry.computed, nil
	}

	return bc.fetchAndCache(host)
}

// FetchBrandPreview fetches a draft brand config using a scoped preview token.
// The token is passed as a query parameter to the preview endpoint — no auth
// header is needed. Always bypasses cache.
func (bc *BrandConfigClient) FetchBrandPreview(host, token string) (BrandConfig, json.RawMessage, error) {
	reqURL := fmt.Sprintf("%s/brands/resolve/preview?host=%s&token=%s",
		bc.apiBase,
		url.QueryEscape(host),
		url.QueryEscape(token),
	)

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return DefaultBrandConfig(), nil, fmt.Errorf("creating preview request: %w", err)
	}

	resp, err := bc.client.Do(req)
	if err != nil {
		return DefaultBrandConfig(), nil, fmt.Errorf("fetching preview for host %q: %w", host, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return DefaultBrandConfig(), nil, fmt.Errorf("preview API returned %d for host %q: %s", resp.StatusCode, host, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return DefaultBrandConfig(), nil, fmt.Errorf("reading preview response for host %q: %w", host, err)
	}

	var apiResp brandAPIResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return DefaultBrandConfig(), nil, fmt.Errorf("parsing preview response for host %q: %w", host, err)
	}

	cfg := mapAPIResponseToBrandConfig(apiResp)
	return cfg, apiResp.Computed, nil
}

// fetchAndCache fetches the brand config from the API, caches it, and returns
// the result. On error it returns stale cache if available, otherwise caches a
// negative entry (defaults) to prevent repeated API calls for unknown hosts.
func (bc *BrandConfigClient) fetchAndCache(host string) (BrandConfig, json.RawMessage, error) {
	cfg, computed, err := bc.doFetch(host)
	if err != nil {
		// Fall back to stale cache entry if one exists.
		bc.mu.RLock()
		stale, ok := bc.cache[host]
		bc.mu.RUnlock()

		if ok {
			log.Warnf("brand config fetch failed for %q, using stale cache: %v", host, err)
			return stale.config, stale.computed, nil
		}

		// Cache the miss so we don't re-fetch on every request.
		log.Warnf("brand config fetch failed for %q, caching negative result: %v", host, err)
		bc.cacheEntry(host, &cachedBrand{
			config:    DefaultBrandConfig(),
			computed:  nil,
			fetchedAt: time.Now(),
			negative:  true,
		})
		return DefaultBrandConfig(), nil, err
	}

	bc.cacheEntry(host, &cachedBrand{
		config:    cfg,
		computed:  computed,
		fetchedAt: time.Now(),
	})

	return cfg, computed, nil
}

// cacheEntry stores a brand cache entry and evicts the oldest entry if the
// cache has reached maxSize.
func (bc *BrandConfigClient) cacheEntry(host string, entry *cachedBrand) {
	bc.mu.Lock()
	defer bc.mu.Unlock()

	// If host is already cached, just update it (no change to order).
	if _, exists := bc.cache[host]; exists {
		bc.cache[host] = entry
		return
	}

	// Evict oldest if at capacity.
	if bc.maxSize > 0 && len(bc.cache) >= bc.maxSize {
		oldest := bc.order[0]
		bc.order = bc.order[1:]
		delete(bc.cache, oldest)
	}

	bc.cache[host] = entry
	bc.order = append(bc.order, host)
}

// doFetch performs the HTTP GET to the Brand Config API's published resolve
// endpoint and returns the mapped BrandConfig and raw computed JSON.
func (bc *BrandConfigClient) doFetch(host string) (BrandConfig, json.RawMessage, error) {
	reqURL := fmt.Sprintf("%s/brands/resolve?host=%s", bc.apiBase, url.QueryEscape(host))

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return BrandConfig{}, nil, fmt.Errorf("creating request: %w", err)
	}

	resp, err := bc.client.Do(req)
	if err != nil {
		return BrandConfig{}, nil, fmt.Errorf("fetching brand for host %q: %w", host, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return BrandConfig{}, nil, fmt.Errorf("brand API returned %d for host %q: %s", resp.StatusCode, host, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return BrandConfig{}, nil, fmt.Errorf("reading brand response for host %q: %w", host, err)
	}

	var apiResp brandAPIResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return BrandConfig{}, nil, fmt.Errorf("parsing brand response for host %q: %w", host, err)
	}

	cfg := mapAPIResponseToBrandConfig(apiResp)

	return cfg, apiResp.Computed, nil
}

// mapAPIResponseToBrandConfig extracts template-level fields from the API
// response's computed JSON, falling back to defaults for any missing field.
func mapAPIResponseToBrandConfig(resp brandAPIResponse) BrandConfig {
	cfg := DefaultBrandConfig()

	if len(resp.Computed) == 0 {
		return cfg
	}

	// Parse computed into a generic nested map.
	var computed map[string]json.RawMessage
	if err := json.Unmarshal(resp.Computed, &computed); err != nil {
		log.Warnf("failed to parse computed config for %q: %v", resp.Slug, err)
		return cfg
	}

	// Helper: parse a section of computed into a generic map.
	parseSection := func(key string) map[string]json.RawMessage {
		raw, ok := computed[key]
		if !ok {
			return nil
		}
		var section map[string]json.RawMessage
		if err := json.Unmarshal(raw, &section); err != nil {
			return nil
		}
		return section
	}

	// Helper: get a string value from a section map.
	getString := func(section map[string]json.RawMessage, key string) string {
		if section == nil {
			return ""
		}
		raw, ok := section[key]
		if !ok {
			return ""
		}
		var s string
		if err := json.Unmarshal(raw, &s); err != nil {
			return ""
		}
		return s
	}

	// Helper: get a nested string value (one level deeper).
	getNestedString := func(section map[string]json.RawMessage, outerKey, innerKey string) string {
		if section == nil {
			return ""
		}
		raw, ok := section[outerKey]
		if !ok {
			return ""
		}
		var inner map[string]json.RawMessage
		if err := json.Unmarshal(raw, &inner); err != nil {
			return ""
		}
		return getString(inner, innerKey)
	}

	// metadata section
	// Note: computed.metadata does not include "description" — it only exists in
	// the raw config. The default description is used for HTML meta tags. If
	// per-brand descriptions are needed, add the field to acorn's ComputedMetadata.
	metadata := parseSection("metadata")
	if v := getString(metadata, "displayName"); v != "" {
		cfg.Name = v
	}
	if v := getString(metadata, "description"); v != "" {
		cfg.Description = v
	}

	// web section
	web := parseSection("web")
	if v := getString(web, "themeColor"); v != "" {
		cfg.ThemeColor = v
	}
	if v := getString(web, "title"); v != "" {
		cfg.Title = v
	}
	if v := getNestedString(web, "domains", "main"); v != "" {
		cfg.Domain = v
	}
	if v := getNestedString(web, "domains", "shortlink"); v != "" {
		cfg.Shortlink = v
	}

	// messages section
	messages := parseSection("messages")
	if v := getString(messages, "primaryCTA"); v != "" {
		cfg.PrimaryCTA = v
	}

	// theme section
	theme := parseSection("theme")

	// theme.css subsection
	if v := getNestedString(theme, "css", "selectionLight"); v != "" {
		cfg.SelectionLight = v
	}
	if v := getNestedString(theme, "css", "selectionDark"); v != "" {
		cfg.SelectionDark = v
	}

	// theme.hue — may be a float64, so try both float and string.
	if theme != nil {
		if raw, ok := theme["hue"]; ok {
			var f float64
			if err := json.Unmarshal(raw, &f); err == nil {
				cfg.BrandHue = fmt.Sprintf("%g", f)
			} else {
				var s string
				if err := json.Unmarshal(raw, &s); err == nil && s != "" {
					cfg.BrandHue = s
				}
			}
		}
	}

	// theme.brand subsection — bg colors with fallback aliases.
	brandColors := func() map[string]json.RawMessage {
		if theme == nil {
			return nil
		}
		raw, ok := theme["brand"]
		if !ok {
			return nil
		}
		var m map[string]json.RawMessage
		if err := json.Unmarshal(raw, &m); err != nil {
			return nil
		}
		return m
	}()

	getColorOrFallback := func(primary, fallback string) string {
		if v := getString(brandColors, primary); v != "" {
			return v
		}
		return getString(brandColors, fallback)
	}

	if v := getColorOrFallback("bgLight", "white"); v != "" {
		cfg.BgLight = v
	}
	if v := getColorOrFallback("bgDark", "black"); v != "" {
		cfg.BgDark = v
	}
	if v := getColorOrFallback("bgDim", "twilight"); v != "" {
		cfg.BgDim = v
	}

	// assets section
	assets := parseSection("assets")
	if v := getString(assets, "favicon"); v != "" {
		cfg.Favicon = v
	}
	if v := getString(assets, "logo"); v != "" {
		cfg.Logo = v
	}
	if v := getString(assets, "logoDark"); v != "" {
		cfg.LogoDark = v
	}
	if v := getString(assets, "logoLight"); v != "" {
		cfg.LogoLight = v
	}
	if v := getString(assets, "socialCard"); v != "" {
		cfg.SocialCard = v
	}

	return cfg
}
