package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestCoerceTheme(t *testing.T) {
	cases := map[string]string{
		"dawn": "dawn", "day": "day", "dusk": "dusk", "night": "night",
		"":        "day",
		"garbage": "day",
		"DAY":     "day", // case-insensitive
	}
	for in, want := range cases {
		if got := CoerceTheme(in); got != want {
			t.Errorf("CoerceTheme(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestThemeBackgroundRGB(t *testing.T) {
	cases := map[string]string{
		"dawn":  "rgb(255, 109, 190)",
		"day":   "rgb(117, 175, 255)",
		"dusk":  "rgb(177, 90, 162)",
		"night": "rgb(0, 21, 51)",
	}
	for in, want := range cases {
		if got := ThemeBackgroundRGB(in); got != want {
			t.Errorf("ThemeBackgroundRGB(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestBuildPassJSON_Golden(t *testing.T) {
	for _, theme := range []string{"dawn", "day", "dusk", "night"} {
		t.Run(theme, func(t *testing.T) {
			got, err := BuildPassJSON("did:plc:abc123", "alice.bsky.social", theme, "TEAMID00")
			if err != nil {
				t.Fatalf("build: %v", err)
			}
			golden := filepath.Join("testdata", "pass-"+theme+".golden.json")
			if os.Getenv("UPDATE_GOLDEN") == "1" {
				if err := os.WriteFile(golden, got, 0o644); err != nil {
					t.Fatalf("write golden: %v", err)
				}
			}
			want, err := os.ReadFile(golden)
			if err != nil {
				t.Fatalf("read golden: %v", err)
			}
			var gotMap, wantMap map[string]any
			if err := json.Unmarshal(got, &gotMap); err != nil {
				t.Fatalf("unmarshal got: %v", err)
			}
			if err := json.Unmarshal(want, &wantMap); err != nil {
				t.Fatalf("unmarshal want: %v", err)
			}
			if !mapsEqual(gotMap, wantMap) {
				t.Errorf("pass.json drift; rerun with UPDATE_GOLDEN=1 to update.\n--- got ---\n%s\n--- want ---\n%s", got, want)
			}
		})
	}
}

func mapsEqual(a, b map[string]any) bool {
	ab, _ := json.Marshal(a)
	bb, _ := json.Marshal(b)
	return string(ab) == string(bb)
}
