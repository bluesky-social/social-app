## Run / Test

### Prep

#### In `/bskyembed`

    # install deps
    yarn

#### In `/` (root)

Make sure to follow main setup instructions first.

    # generate embed static files
    yarn build-embed

### Running

#### In `/bskyweb`

    # run embedr service
    make run-dev-embedr

#### In `/bskyembed`

    # run dev server
    yarn dev

Web server will be available at http://localhost:5173.

Navigate to http://localhost:5173/test for a comprehensive live list of embed test cases.