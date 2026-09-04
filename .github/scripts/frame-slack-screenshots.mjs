import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const FRAME_FILTER =
  'scale=1600:1200:force_original_aspect_ratio=decrease,' +
  'pad=1600:1200:(ow-iw)/2:(oh-ih)/2:color=0xF8F8F8,setsar=1'

export function frameSlackScreenshots({inputPath, outputPath, outputDir}) {
  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  if (!Array.isArray(payload.file_uploads)) {
    throw new Error('Slack upload payload must contain a file_uploads array')
  }

  fs.mkdirSync(outputDir, {recursive: true})
  payload.file_uploads = payload.file_uploads.map((upload, index) => {
    if (
      typeof upload.file !== 'string' ||
      typeof upload.filename !== 'string'
    ) {
      throw new Error(`Invalid Slack file upload at index ${index}`)
    }
    const filename = `${path.parse(path.basename(upload.filename)).name}.png`
    const framedFile = path.join(outputDir, filename)
    execFileSync(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        upload.file,
        '-vf',
        FRAME_FILTER,
        '-frames:v',
        '1',
        framedFile,
      ],
      {stdio: 'inherit'},
    )
    return {...upload, file: framedFile, filename, highlight_type: 'png'}
  })

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
  frameSlackScreenshots({inputPath, outputPath, outputDir})
}
