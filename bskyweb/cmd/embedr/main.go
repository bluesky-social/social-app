package main

import (
	"os"

	_ "github.com/joho/godotenv/autoload"

	logging "github.com/ipfs/go-log"
	"github.com/urfave/cli/v2"
)

var log = logging.Logger("embedr")

func init() {
	logging.SetAllLoggers(logging.LevelDebug)
	//logging.SetAllLoggers(logging.LevelWarn)
}

func main() {
	run(os.Args)
}

func run(args []string) {

	app := cli.App{
		Name:  "embedr",
		Usage: "web server for embed.bsky.app post embeds",
	}

	app.Commands = []*cli.Command{
		&cli.Command{
			Name:   "serve",
			Usage:  "run the server",
			Action: serve,
			Flags: []cli.Flag{
				&cli.StringFlag{
					Name:    "appview-host",
					Usage:   "method, hostname, and port of PDS instance",
					Value:   "https://public.api.bsky.app",
					EnvVars: []string{"ATP_APPVIEW_HOST"},
				},
				&cli.StringFlag{
					Name:     "http-address",
					Usage:    "Specify the local IP/port to bind to",
					Required: false,
					Value:    ":8100",
					EnvVars:  []string{"HTTP_ADDRESS"},
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
