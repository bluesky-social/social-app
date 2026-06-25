package main

import (
	"encoding/json"
	"strings"
)

var themeBgRGB = map[string]string{
	"dawn":  "rgb(255, 109, 190)",
	"day":   "rgb(117, 175, 255)",
	"dusk":  "rgb(177, 90, 162)",
	"night": "rgb(0, 21, 51)",
}

func CoerceTheme(s string) string {
	switch strings.ToLower(s) {
	case "dawn", "day", "dusk", "night":
		return strings.ToLower(s)
	default:
		return "day"
	}
}

func ThemeBackgroundRGB(theme string) string {
	if v, ok := themeBgRGB[theme]; ok {
		return v
	}
	return themeBgRGB["day"]
}

type passField struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Value string `json:"value"`
}

type storeCardFields struct {
	PrimaryFields   []passField `json:"primaryFields"`
	SecondaryFields []passField `json:"secondaryFields"`
	BackFields      []passField `json:"backFields"`
}

type barcode struct {
	Format          string `json:"format"`
	Message         string `json:"message"`
	MessageEncoding string `json:"messageEncoding"`
	AltText         string `json:"altText"`
}

type pkPass struct {
	FormatVersion       int             `json:"formatVersion"`
	PassTypeIdentifier  string          `json:"passTypeIdentifier"`
	SerialNumber        string          `json:"serialNumber"`
	TeamIdentifier      string          `json:"teamIdentifier"`
	OrganizationName    string          `json:"organizationName"`
	Description         string          `json:"description"`
	LogoText            string          `json:"logoText"`
	ForegroundColor     string          `json:"foregroundColor"`
	LabelColor          string          `json:"labelColor"`
	BackgroundColor     string          `json:"backgroundColor"`
	StoreCard           storeCardFields `json:"storeCard"`
	Barcodes            []barcode       `json:"barcodes"`
}

const passTypeIdentifier = "pass.app.bsky.invite"

func BuildPassJSON(did, handle, theme, teamID string) ([]byte, error) {
	theme = CoerceTheme(theme)
	profileURL := "https://bsky.app/profile/" + handle
	atHandle := "@" + handle
	p := pkPass{
		FormatVersion:      1,
		PassTypeIdentifier: passTypeIdentifier,
		SerialNumber:       did + "-" + theme + "-v1",
		TeamIdentifier:     teamID,
		OrganizationName:   "Bluesky",
		Description:        "Bluesky invite - " + atHandle,
		LogoText:           "Bluesky",
		ForegroundColor:    "rgb(255, 255, 255)",
		LabelColor:         "rgb(255, 255, 255)",
		BackgroundColor:    ThemeBackgroundRGB(theme),
		StoreCard: storeCardFields{
			PrimaryFields:   []passField{{Key: "handle", Label: "Handle", Value: atHandle}},
			SecondaryFields: []passField{{Key: "url", Label: "Profile", Value: "bsky.app/profile/" + handle}},
			BackFields: []passField{
				{Key: "about", Label: "About", Value: "Scan the QR to open this profile in any browser, or share the URL below."},
				{Key: "url2", Label: "Profile URL", Value: profileURL},
			},
		},
		Barcodes: []barcode{{
			Format:          "PKBarcodeFormatQR",
			Message:         profileURL,
			MessageEncoding: "iso-8859-1",
			AltText:         atHandle,
		}},
	}
	return json.MarshalIndent(p, "", "  ")
}
