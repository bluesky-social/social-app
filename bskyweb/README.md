## Build / Develop

### SPA Bundle (monolithic static javascript file)

To build the SPA bundle (`bundle.web.js`), first get a JavaScript development
environment set up. Either follow the top-level README, or something quick
like:

    # install nodejs
    nvm install
    nvm use
    npm install --global yarn

    # setup tools and deps (in top level of this repo)
    yarn install --frozen-lockfile

    # run yarn web dev server, if you wanted
    yarn web

Then build and copy over the big 'ol `bundle.web.js` file:

    # in the top level of this repo
    yarn build-web

### Golang Daemon

Install golang. We are generally using v1.22+.

In this directory (`bskyweb/`):

    # re-build and run daemon
    go run ./cmd/bskyweb serve

    # build and output a binary
    go build -o bskyweb ./cmd/bskyweb/

The easiest way to configure the daemon is to copy `example.env` to `.env` and
fill in auth values there.
