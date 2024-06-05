import {FFmpegKit, ReturnCode} from 'ffmpeg-kit-react-native'

const PRESET = 'faster'

export async function compressVideo(file: string) {
  const ext = file.split('.').pop()
  const newFile = file.replace(`.${ext}`, 'compressed.mp4')
  const result = await FFmpegKit.execute(
    `-i ${file} -c:v libx264 -crf 28 -preset ${PRESET} -b:v 1M -vf "scale=-1:720" -t 90 -c:a aac -b:a 128k -movflags +faststart ${newFile}`,
  )

  return {
    uri: ReturnCode.isSuccess(await result.getReturnCode()) ? newFile : null,
    session: result,
  }
}
