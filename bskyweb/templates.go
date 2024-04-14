package bskyweb

import "embed"

//go:embed templates/*
var TemplateFS embed.FS

//go:embed embedr-templates/*
var EmbedrTemplateFS embed.FS
