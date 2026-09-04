import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import sharp from 'sharp'

import {frameSlackScreenshots} from './frame-slack-screenshots.mjs'

test('frames Slack screenshots as 4:3 PNGs', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'maestro-slack-frame-'))
  t.after(() => fs.rmSync(root, {recursive: true, force: true}))
  const source = path.join(root, 'source.png')
  const input = path.join(root, 'input.json')
  const output = path.join(root, 'output.json')
  const outputDir = path.join(root, 'images')
  await sharp({
    create: {
      width: 2,
      height: 4,
      channels: 3,
      background: '#ffffff',
    },
  })
    .png()
    .toFile(source)
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

  await frameSlackScreenshots({inputPath: input, outputPath: output, outputDir})

  const payload = JSON.parse(fs.readFileSync(output, 'utf8'))
  const {data, info} = await sharp(payload.file_uploads[0].file)
    .raw()
    .toBuffer({resolveWithObject: true})
  const pixelAt = (x, y) => {
    const offset = (y * info.width + x) * info.channels
    return Array.from(data.subarray(offset, offset + 3))
  }

  assert.equal(info.width, 1600)
  assert.equal(info.height, 1200)
  assert.deepEqual(pixelAt(0, 0), [248, 248, 248])
  assert.deepEqual(pixelAt(800, 600), [255, 255, 255])
  assert.equal(payload.file_uploads[0].filename, '1-android-login.png')
  assert.equal(payload.file_uploads[0].highlight_type, 'png')
})
