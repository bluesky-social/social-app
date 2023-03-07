
- have golang code for a simple web server in here

naming:
- webapp
- bskyapp
- bskyweb
- bskywebapp
- bluesky-web

- daemon: bskyweb
- service: bskyweb
- staging: app.staging.bsky.dev
- prod: bsky.app

notes on what this does:
- never does auth to backend; that is entirely left to JS
- https://github.com/flosch/pongo2 + addons + trans (or stdlib?)
- serves static assets (built), with version/hash/commit in path name
- put nginx in container as well? hrm.


## dev setup

first ensure nvm and node 18 set up:

	nvm install 18
	nvm use 18
	npm install --global yarn

then, in this repo:

    yarn install --frozen-lockfile

start web dev server:

    yarn web

ok, how about with bskyweb?

    yarn webpack build --config ./web/webpack.config.js --color
    cp bundle.web.js web/static

## TODO

x echo: serve static files from a directory
- implement existing path URLs
    => with XRPC backend requests
- workflow: edit app, have updates auto-load (?)
- social-app: build everything to a directory
- web-specific README
- what, if any, timeline do we show?
    => something custom
    => staff-picks.bsky.social -> author feed
    => homepage.bsky.social
    => featured.bsky.social

## current path scheme (routes)

meta stuff:

    /
    /contacts
    /search
    /notifications
    /settings

user:

    /profile/<name>
    /profile/<name>/followers
    /profile/<name>/follows

    /profile/<name>/post/<rkey>
    /profile/<name>/post/<rkey>/upvoted-by
    /profile/<name>/post/<rkey>/downvoted-by
    /profile/<name>/post/<rkey>/reposted-by

## proposed path scheme

static endpoints:

    /static/<commit>/<path>

markdown pages:

    /about
    /about/legal
    /about/privacy

endpoints:

    /search

    /account/login
    /account/signup
    /account/notifications
    /account/settings
    /account/timeline

content:

    /u/<handle>
    /u/<handle>
    /u/<handle>/follows
    /u/<handle>/followed-by

    /p/<handle>/<rkey>

    /user/<handle>
    /account/<handle>
    /handle/<handle>
    /did/<did>
    /repo/<handle>

    /post/<handle-or-did>/<rkey>

path decisions:
- trailing slashes
- redirect did to handle (or vice-versa)
- redirect old-style paths to new scheme

## templates

- base
- 404
- 5xx ("sorry")
- about template (renders markdown)
- app template
