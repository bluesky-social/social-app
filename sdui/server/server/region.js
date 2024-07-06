'use strict'

const path = require('path')
const register = require('react-server-dom-webpack/node-register')
register()
const babelRegister = require('@babel/register')
babelRegister({
  babelrc: false,
  ignore: [
    /\/(build|node_modules)\//,
    function (file) {
      // eslint-disable-next-line no-path-concat
      if ((path.dirname(file) + '/').startsWith(__dirname + '/')) {
        // Ignore everything in this folder
        // because it's a mix of CJS and ESM
        // and working with raw code is easier.
        return true
      }
      return false
    },
  ],
  presets: ['@babel/preset-react'],
  plugins: ['@babel/transform-modules-commonjs'],
  sourceMaps: process.env.NODE_ENV === 'development' ? 'inline' : false,
})

if (typeof fetch === 'undefined') {
  // Patch fetch for earlier Node versions.
  global.fetch = require('undici').fetch
}

const express = require('express')
const bodyParser = require('body-parser')
const busboy = require('busboy')
const app = express()
const compress = require('compression')

app.use(compress())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

// Application

const React = require('react')

async function renderApp(res, returnValue, formState) {
  const {renderToPipeableStream} = await import(
    'react-server-dom-webpack/server'
  )
  // const m = require('../src/App.js');
  const m = await import('../src/App.js')

  let moduleMap = {}
  for (let id of Object.keys(await import('../src/client.js'))) {
    moduleMap[id] = {
      id,
      name: 'default',
      chunks: ['main'],
    }
  }

  const App = m.default.default || m.default
  const root = React.createElement(
    React.Fragment,
    null,
    React.createElement(App),
  )
  // For client-invoked server actions we refresh the tree and return a return value.
  const payload = {root, returnValue, formState}
  const {pipe} = renderToPipeableStream(payload, moduleMap)
  pipe(res)
}

app.get('/', async function (req, res) {
  await renderApp(res, null, null)
})

app.post('/', bodyParser.text(), async function (req, res) {
  const {decodeReply, decodeReplyFromBusboy} = await import(
    'react-server-dom-webpack/server'
  )
  const serverReference = req.get('rsc-action')
  if (serverReference) {
    // This is the client-side case
    const [filepath, name] = serverReference.split('#')
    const action = (await import(filepath))[name]
    // Validate that this is actually a function we intended to expose and
    // not the client trying to invoke arbitrary functions. In a real app,
    // you'd have a manifest verifying this before even importing it.
    if (action.$$typeof !== Symbol.for('react.server.reference')) {
      throw new Error('Invalid action')
    }

    let args
    if (req.is('multipart/form-data')) {
      // Use busboy to streamingly parse the reply from form-data.
      const bb = busboy({headers: req.headers})
      const reply = decodeReplyFromBusboy(bb)
      req.pipe(bb)
      args = await reply
    } else {
      args = await decodeReply(req.body)
    }
    const result = action.apply(null, args)
    try {
      // Wait for any mutations
      await result
    } catch (x) {
      // We handle the error on the client
    }
    // Refresh the client and return the value
    renderApp(res, result, null)
  }
})

app.listen(3001, () => {
  console.log('Regional Flight Server listening on port 3001...')
})

app.on('error', function (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  switch (error.code) {
    case 'EACCES':
      console.error('port 3001 requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error('Port 3001 is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
})
