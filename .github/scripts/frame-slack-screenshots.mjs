import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import sharp from 'sharp'

export async function frameSlackScreenshots({
  inputPath,
  outputPath,
  outputDir,
}) {
  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  if (!Array.isArray(payload.file_uploads)) {
    throw new Error('Slack upload payload must contain a file_uploads array')
  }

  fs.mkdirSync(outputDir, {recursive: true})
  const framedUploads = []
  for (const [index, upload] of payload.file_uploads.entries()) {
    if (
      typeof upload.file !== 'string' ||
      typeof upload.filename !== 'string'
    ) {
      throw new Error(`Invalid Slack file upload at index ${index}`)
    }
    const filename = `${path.parse(path.basename(upload.filename)).name}.png`
    const framedFile = path.join(outputDir, filename)
    await sharp(upload.file)
      .resize(1600, 1200, {fit: 'contain', background: '#f8f8f8'})
      .png()
      .toFile(framedFile)
    framedUploads.push({
      ...upload,
      file: framedFile,
      filename,
      highlight_type: 'png',
    })
  }

  payload.file_uploads = framedUploads
  fs.writeFileSync(outputPath, `${JSON.stringify(payload)}\n`)
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
) {
  const [inputPath, outputPath, outputDir] = process.argv.slice(2)
  if (!inputPath || !outputPath || !outputDir) {
    throw new Error(
      'Usage: frame-slack-screenshots.mjs <input.json> <output.json> <output-dir>',
    )
  }
  await frameSlackScreenshots({inputPath, outputPath, outputDir})
}
