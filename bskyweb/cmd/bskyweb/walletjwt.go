package main

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"net/url"

	"github.com/golang-jwt/jwt/v5"
)

type WalletConfig struct {
	IssuerEmail string
	IssuerID    string
	PrivateKey  *rsa.PrivateKey
	HeroBaseURL string
	LogoURL     string
}

var hexBgByTheme = map[string]string{
	"dawn":  "#ff6dbe",
	"day":   "#75afff",
	"dusk":  "#b15aa2",
	"night": "#001533",
}

func LoadWalletConfig(serviceAccountJSON []byte, issuerID, heroBaseURL, logoURL string) (*WalletConfig, error) {
	var sa struct {
		ClientEmail string `json:"client_email"`
		PrivateKey  string `json:"private_key"`
	}
	if err := json.Unmarshal(serviceAccountJSON, &sa); err != nil {
		return nil, err
	}
	block, _ := pem.Decode([]byte(sa.PrivateKey))
	if block == nil {
		return nil, errors.New("service account private_key: no PEM block")
	}
	k, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	rsaKey, ok := k.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("service account key is not RSA")
	}
	return &WalletConfig{
		IssuerEmail: sa.ClientEmail,
		IssuerID:    issuerID,
		PrivateKey:  rsaKey,
		HeroBaseURL: heroBaseURL,
		LogoURL:     logoURL,
	}, nil
}

func BuildSaveJWT(cfg *WalletConfig, did, handle, theme string) (string, error) {
	theme = CoerceTheme(theme)
	profileURL := "https://bsky.app/profile/" + handle
	hexBg := hexBgByTheme[theme]
	heroQuery := url.Values{"did": {did}, "theme": {theme}}
	heroURL := cfg.HeroBaseURL + "?" + heroQuery.Encode()

	obj := map[string]any{
		"id":      cfg.IssuerID + ".bsky-" + did + "-" + theme,
		"classId": cfg.IssuerID + ".bsky_invite_v1",
		"logo": map[string]any{
			"sourceUri": map[string]any{"uri": cfg.LogoURL},
		},
		"cardTitle":           langValue("Bluesky"),
		"header":              langValue("@" + handle),
		"subheader":           langValue("bsky.app/profile/" + handle),
		"hexBackgroundColor":  hexBg,
		"heroImage":           map[string]any{"sourceUri": map[string]any{"uri": heroURL}},
		"barcode": map[string]any{
			"type":          "QR_CODE",
			"value":         profileURL,
			"alternateText": "@" + handle,
		},
		"linksModuleData": map[string]any{
			"uris": []any{map[string]any{"uri": profileURL, "description": "Open profile"}},
		},
	}

	claims := jwt.MapClaims{
		"iss": cfg.IssuerEmail,
		"aud": "google",
		"typ": "savetowallet",
		"payload": map[string]any{
			"genericObjects": []any{obj},
		},
	}

	tok := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	return tok.SignedString(cfg.PrivateKey)
}

func langValue(s string) map[string]any {
	return map[string]any{"defaultValue": map[string]any{"language": "en", "value": s}}
}
