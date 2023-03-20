package main

import (
	"os"

	logging "github.com/ipfs/go-log"
	"github.com/joho/godotenv"
	"github.com/urfave/cli/v2"
)

var log = logging.Logger("bskyweb")

func init() {
	logging.SetAllLoggers(logging.LevelDebug)
	//logging.SetAllLoggers(logging.LevelWarn)
}

func main() {

	// only try dotenv if it exists
	if _, err := os.Stat(".env"); err == nil {
		err := godotenv.Load()
		if err != nil {
			log.Fatal("Error loading .env file")
		}
	}

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
					Name:    "pds-host",
					Usage:   "method, hostname, and port of PDS instance",
					Value:   "http://localhost:4849",
					EnvVars: []string{"ATP_PDS_HOST"},
				},
				&cli.StringFlag{
					Name:     "handle",
					Usage:    "for PDS login",
					Required: true,
					EnvVars:  []string{"ATP_AUTH_HANDLE"},
				},
				&cli.StringFlag{
					Name:     "password",
					Usage:    "for PDS login",
					Required: true,
					EnvVars:  []string{"ATP_AUTH_PASSWORD"},
				},
				&cli.StringFlag{
					Name:     "mailmodo-api-key",
					Usage:    "Mailmodo API key",
					Required: false,
					EnvVars:  []string{"MAILMODO_API_KEY"},
				},
				&cli.StringFlag{
					Name:     "mailmodo-list-name",
					Usage:    "Mailmodo contact list to add email addresses to",
					Required: false,
					EnvVars:  []string{"MAILMODO_LIST_NAME"},
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
