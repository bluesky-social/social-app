# Build instructions

## Running Web App

- `yarn`
- `yarn web`

You're all set!

## Go-Server Build

The Go server in this repository is only used for serving the web app in production. Usually you won't need to touch it.

### Prerequisites

- [Go](https://go.dev/)
- [Yarn](https://yarnpkg.com/)

### Steps

To run the build with Go, use staging credentials, your own, or any other account you create.

```
cd social-app
yarn && yarn build-web
cd bskyweb/
go mod tidy
go build -v -tags timetzdata -o bskyweb ./cmd/bskyweb
./bskyweb serve --appview-host=https://public.api.bsky.app
```

On build success, access the application at [http://localhost:8100/](http://localhost:8100/). Subsequent changes require re-running the above steps in order to be reflected.

