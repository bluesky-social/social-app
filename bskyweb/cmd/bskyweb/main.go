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
					Name:  "ogcard-host",
					Usage: "scheme, hostname, and port of ogcard service",
					Required: false,
					EnvVars: []string{"OGCARD_HOST"},
				},
				&cli.StringFlag{
					Name:     "http-address",
					Usage:    "Specify the local IP/port to bind to",
					Required: false,
					Value:    ":8100",
					EnvVars:  []string{"HTTP_ADDRESS"},
				},
				&cli.StringFlag{
					Name:     "link-host",
					Usage:    "scheme, hostname, and port of link service",
					Required: false,
					Value:    "",
					EnvVars:  []string{"LINK_HOST"},
				},
				&cli.BoolFlag{
					Name:     "debug",
					Usage:    "Enable debug mode",
					Value:    false,
					Required: false,
					EnvVars:  []string{"DEBUG"},
				},
			},
		},
	}
	app.RunAndExitOnError()
}
