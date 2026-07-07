package main

import (
	"os"

	_ "github.com/joho/godotenv/autoload"

	logging "github.com/ipfs/go-log"
	"github.com/urfave/cli/v2"
)

var log = logging.Logger("bskyweb")

func init() {
	logging.SetAllLoggers(logging.LevelDebug)
	//logging.SetAllLoggers(logging.LevelWarn)
}

func main() {
	run(os.Args)
}

func run(args []string) {

	app := cli.App{
		Name:  "bskyweb",
		Usage: "web server for bsky.app web app (SPA)",
	}

	app.Commands = []*cli.Command{
		&cli.Command{
			Name:   "serve",
			Usage:  "run the server",
			Action: serve,
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:  "appview-host",
					Usage: "scheme, hostname, and port of PDS instance",
					Value: "http://localhost:2584",
					// retain old PDS env var for easy transition
					EnvVars: []string{"ATP_APPVIEW_HOST", "ATP_PDS_HOST"},
				},
				&cli.StringFlag{
					Name:     "ogcard-host",
					Usage:    "scheme, hostname, and port of ogcard service",
					Required: false,
					EnvVars:  []string{"OGCARD_HOST"},
				},
				&cli.StringFlag{
					Name:     "chat-host",
					Usage:    "scheme, hostname, and port of chat appview",
					Required: false,
					EnvVars:  []string{"CHAT_HOST"},
				},
				&cli.StringFlag{
					Name:     "http-address",
					Usage:    "Specify the local IP/port to bind to",
					Required: false,
					Value:    ":8100",
					EnvVars:  []string{"HTTP_ADDRESS"},
				},
				&cli.StringFlag{
					Name:     "metrics-address",
					Usage:    "Specify the local IP/port to bind the metrics server to",
					Required: false,
					Value:    ":9090",
					EnvVars:  []string{"METRICS_HTTP_ADDRESS"},
				},
				&cli.StringFlag{
					Name:     "link-host",
					Usage:    "scheme, hostname, and port of link service",
					Required: false,
					Value:    "",
					EnvVars:  []string{"LINK_HOST"},
				},
				&cli.StringFlag{
					Name:    "ipcc-host",
					Usage:   "scheme, hostname, and port of ipcc service",
					Value:   "https://localhost:8730",
					EnvVars: []string{"IPCC_HOST"},
				},
				&cli.BoolFlag{
					Name:     "debug",
					Usage:    "Enable debug mode",
					Value:    false,
					Required: false,
					EnvVars:  []string{"DEBUG"},
				},
				&cli.StringFlag{
					Name:     "basic-auth-password",
					Usage:    "optional password to restrict access to web interface",
					Required: false,
					Value:    "",
					EnvVars:  []string{"BASIC_AUTH_PASSWORD"},
				},
				&cli.StringSliceFlag{
					Name:     "cors-allowed-origins",
					Usage:    "list of allowed origins for CORS requests",
					Required: false,
					Value:    cli.NewStringSlice("https://bsky.app", "https://main.bsky.dev", "https://app.staging.bsky.dev"),
					EnvVars:  []string{"CORS_ALLOWED_ORIGINS"},
				},
				&cli.StringFlag{
					Name:     "static-cdn-host",
					Usage:    "scheme, hostname, and port of static content CDN, don't end with a slash",
					Required: false,
					Value:    "",
					EnvVars:  []string{"STATIC_CDN_HOST"},
				},
				&cli.BoolFlag{
					Name:     "bsky-canonical-instance",
					Usage:    "Enable if this is the canonical deployment (bsky.app)",
					Value:    false,
					Required: false,
					EnvVars:  []string{"BSKY_CANONICAL_INSTANCE"},
				},
				&cli.StringFlag{
					Name:     "brand-config",
					Usage:    "path to community brand config JSON file",
					Required: false,
					Value:    "",
					EnvVars:  []string{"BRAND_CONFIG"},
				},
				&cli.StringFlag{
					Name:     "config-api-url",
					Usage:    "base URL of the Brand Config API (enables multi-brand mode)",
					Required: false,
					Value:    "",
					EnvVars:  []string{"BRAND_CONFIG_API_URL"},
				},
				&cli.StringSliceFlag{
					Name:     "frame-ancestors",
					Usage:    "list of origins allowed to iframe this app (sets CSP frame-ancestors, disables X-Frame-Options)",
					Required: false,
					EnvVars:  []string{"FRAME_ANCESTORS"},
				},
				&cli.StringFlag{
					Name:     "brand-host-override",
					Usage:    "override the HTTP Host used for brand config resolution (for local development)",
					Required: false,
					Value:    "",
					EnvVars:  []string{"BRAND_HOST_OVERRIDE"},
				},
				&cli.BoolFlag{
					Name:     "robots-disallow-all",
					Usage:    "Crawling is allowed by default. Enable this flag to Disallow all",
					Value:    false,
					Required: false,
					EnvVars:  []string{"ROBOTS_DISALLOW_ALL"},
				},
			},
		},
	}
	app.RunAndExitOnError()
}
