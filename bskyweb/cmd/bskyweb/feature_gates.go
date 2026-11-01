package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync/atomic"
	"time"
)

const featureGateRefreshInterval = time.Minute
const featureGateMaxAge = 4 * time.Hour
const featureGateMaxBytes = 1024 * 1024

/** featureGateSnapshot contains HTML-safe JSON and the time its source was verified. */
type featureGateSnapshot struct {
	json      string
	fetchedAt time.Time
}

/** featureGateCache refreshes independently of page requests and retains the last valid payload. */
type featureGateCache struct {
	apiHost   string
	clientKey string
	client    *http.Client
	current   atomic.Pointer[featureGateSnapshot]
}

func (cache *featureGateCache) run(ctx context.Context) {
	ticker := time.NewTicker(featureGateRefreshInterval)
	defer ticker.Stop()
	for {
		if err := cache.refresh(ctx); err != nil && ctx.Err() == nil {
			log.Warnf("refreshing HTML feature gates failed: %s", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (cache *featureGateCache) refresh(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, cache.apiHost+"/api/features/"+cache.clientKey, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	res, err := cache.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status: %d", res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, featureGateMaxBytes+1))
	if err != nil {
		return err
	}
	if len(body) > featureGateMaxBytes {
		return fmt.Errorf("feature payload exceeds %d bytes", featureGateMaxBytes)
	}
	if err := validateFeatureGatePayload(body); err != nil {
		return err
	}

	fetchedAt := time.Now().UTC()
	bootstrap, err := json.Marshal(struct {
		SchemaVersion int             `json:"schemaVersion"`
		APIHost       string          `json:"apiHost"`
		ClientKey     string          `json:"clientKey"`
		FetchedAt     time.Time       `json:"fetchedAt"`
		Payload       json.RawMessage `json:"payload"`
	}{1, cache.apiHost, cache.clientKey, fetchedAt, body})
	if err != nil {
		return err
	}
	/* encoding/json also escapes HTML inside RawMessage, including literal </script>. */
	cache.current.Store(&featureGateSnapshot{json: string(bootstrap), fetchedAt: fetchedAt})
	return nil
}

func validateFeatureGatePayload(body []byte) error {
	var payload struct {
		Features    map[string]json.RawMessage `json:"features"`
		SavedGroups map[string][]any           `json:"savedGroups"`
		DateUpdated string                     `json:"dateUpdated"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return fmt.Errorf("invalid feature payload: %w", err)
	}
	if payload.Features == nil {
		return fmt.Errorf("feature payload is missing features")
	}
	if _, err := time.Parse(time.RFC3339Nano, payload.DateUpdated); err != nil {
		return fmt.Errorf("invalid feature revision: %w", err)
	}
	for key, definition := range payload.Features {
		var feature map[string]json.RawMessage
		if err := json.Unmarshal(definition, &feature); err != nil || feature == nil {
			return fmt.Errorf("invalid definition for feature %q", key)
		}
		if rules, ok := feature["rules"]; ok {
			var parsed []map[string]json.RawMessage
			if err := json.Unmarshal(rules, &parsed); err != nil || parsed == nil {
				return fmt.Errorf("invalid rules for feature %q", key)
			}
			for _, rule := range parsed {
				if rule == nil {
					return fmt.Errorf("invalid rule for feature %q", key)
				}
			}
		}
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(body, &fields); err != nil {
		return err
	}
	if _, ok := fields["savedGroups"]; ok && payload.SavedGroups == nil {
		return fmt.Errorf("invalid saved groups")
	}
	for key, group := range payload.SavedGroups {
		if group == nil {
			return fmt.Errorf("invalid saved group %q", key)
		}
	}
	return nil
}

func (cache *featureGateCache) snapshot() string {
	if cache == nil {
		return ""
	}
	snapshot := cache.current.Load()
	if snapshot == nil || time.Since(snapshot.fetchedAt) > featureGateMaxAge {
		return ""
	}
	return snapshot.json
}

func newFeatureGateCache(apiHost, clientKey string) *featureGateCache {
	return &featureGateCache{
		apiHost:   strings.TrimRight(apiHost, "/"),
		clientKey: clientKey,
		client:    &http.Client{Timeout: 5 * time.Second},
	}
}
