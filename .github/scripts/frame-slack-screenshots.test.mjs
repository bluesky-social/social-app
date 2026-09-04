import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {frameSlackScreenshots} from './frame-slack-screenshots.mjs'

test('frames Slack screenshots as 4:3 PNGs', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'maestro-slack-frame-'))
  t.after(() => fs.rmSync(root, {recursive: true, force: true}))
  const source = path.join(root, 'source.png')
  const input = path.join(root, 'input.json')
  const output = path.join(root, 'output.json')
  const outputDir = path.join(root, 'images')
  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=white:s=2x4',
      '-frames:v',
      '1',
      source,
    ],
    {stdio: 'inherit'},
  )
  fs.writeFileSync(
    input,
    JSON.stringify({
      file_uploads: [
        {
          file: source,
          filename: '1-android-login.png',
          alt_text: 'Android failure screenshot for login',
        },
      ],
    }),
  )

  frameSlackScreenshots({inputPath: input, outputPath: output, outputDir})

  const payload = JSON.parse(fs.readFileSync(output, 'utf8'))
  const framed = fs.readFileSync(payload.file_uploads[0].file)
  assert.equal(framed.readUInt32BE(16), 1600)
  assert.equal(framed.readUInt32BE(20), 1200)
  assert.equal(payload.file_uploads[0].filename, '1-android-login.png')
  assert.equal(payload.file_uploads[0].highlight_type, 'png')
})
