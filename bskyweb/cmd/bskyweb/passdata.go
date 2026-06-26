package main

import (
	"encoding/json"
	"strings"
	"time"
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
	Key           string `json:"key"`
	Label         string `json:"label"`
	Value         string `json:"value"`
	DateStyle     string `json:"dateStyle,omitempty"`
	TextAlignment string `json:"textAlignment,omitempty"`
}

// genericFields is the iOS <= 26 fallback layout that Pass Designer produces
// in the `generic` block. Notably no backFields - Pass Designer omits that
// key in this block.
type genericFields struct {
	HeaderFields    []passField `json:"headerFields"`
	PrimaryFields   []passField `json:"primaryFields"`
	SecondaryFields []passField `json:"secondaryFields"`
}

// posterFields is the iOS 27+ layout in the `posterGeneric` block. All six
// field slots present, empty arrays where not used (matches Pass Designer's
// output literally).
type posterFields struct {
	AuxiliaryFields []passField `json:"auxiliaryFields"`
	BackFields      []passField `json:"backFields"`
	FooterFields    []passField `json:"footerFields"`
	HeaderFields    []passField `json:"headerFields"`
	PrimaryFields   []passField `json:"primaryFields"`
	SecondaryFields []passField `json:"secondaryFields"`
}

type barcode struct {
	Format          string `json:"format"`
	Message         string `json:"message"`
	MessageEncoding string `json:"messageEncoding"`
	AltText         string `json:"altText"`
}

type pkPass struct {
	FormatVersion           int           `json:"formatVersion"`
	PassTypeIdentifier      string        `json:"passTypeIdentifier"`
	SerialNumber            string        `json:"serialNumber"`
	TeamIdentifier          string        `json:"teamIdentifier"`
	OrganizationName        string        `json:"organizationName"`
	Description             string        `json:"description"`
	ForegroundColor         string        `json:"foregroundColor"`
	LabelColor              string        `json:"labelColor"`
	BackgroundColor         string        `json:"backgroundColor"`
	Generic                 genericFields `json:"generic"`
	PosterGeneric           posterFields  `json:"posterGeneric"`
	SuppressHeaderDarkening bool          `json:"suppressHeaderDarkening"`
	UseAutomaticColors      bool          `json:"useAutomaticColors"`
	Barcodes                []barcode     `json:"barcodes"`
}

const passTypeIdentifier = "pass.xyz.blueskyweb.app"

// BuildPassJSON builds the pkpass JSON matching the Pass Designer-exported
// layout literally: `generic` has handle (primary) + member-since (secondary);
// `posterGeneric` adds DID as a footer field and stacks handle + member-since
// in primaryFields.
//
// pdsHost and displayName are currently unused - the design landed without
// them - but their plumbing is retained in callers for a possible future
// design. The token still carries pdsHost.
func BuildPassJSON(did, handle, displayName, pdsHost, theme, teamID string, createdAt time.Time) ([]byte, error) {
	_ = displayName
	_ = pdsHost
	_ = theme
	theme = CoerceTheme(theme)
	profileURL := "https://bsky.app/profile/" + handle
	createdAtISO := ""
	if !createdAt.IsZero() {
		createdAtISO = createdAt.UTC().Format(time.RFC3339)
	}

	handleField := passField{Key: "handle", Label: "Handle", Value: handle}
	sinceField := passField{Key: "since", Label: "Member Since", Value: createdAtISO, DateStyle: "PKDateStyleShort"}
	didField := passField{Key: "did", Label: "DID", Value: did, TextAlignment: "PKTextAlignmentNatural"}

	p := pkPass{
		FormatVersion:      1,
		PassTypeIdentifier: passTypeIdentifier,
		SerialNumber:       did + "-" + theme + "-v1",
		TeamIdentifier:     teamID,
		OrganizationName:   "Bluesky",
		Description:        "Atmosphere Account",
		ForegroundColor:    "rgb(255,255,255)",
		LabelColor:         "rgb(255,255,255)",
		// Matches Pass Designer's exported backgroundColor. Theme parameter
		// kept in the signature for the URL/serial but no longer affects color.
		BackgroundColor: "rgb(44,103,244)",
		Generic: genericFields{
			HeaderFields:    []passField{},
			PrimaryFields:   []passField{handleField},
			SecondaryFields: []passField{sinceField},
		},
		PosterGeneric: posterFields{
			AuxiliaryFields: []passField{},
			BackFields:      []passField{},
			FooterFields:    []passField{didField},
			HeaderFields:    []passField{},
			PrimaryFields:   []passField{handleField, sinceField},
			SecondaryFields: []passField{},
		},
		SuppressHeaderDarkening: false,
		UseAutomaticColors:      false,
		Barcodes: []barcode{{
			Format:          "PKBarcodeFormatQR",
			Message:         profileURL,
			MessageEncoding: "iso-8859-1",
			AltText:         handle,
		}},
	}
	return json.MarshalIndent(p, "", "  ")
}
