import {FFmpegKit, ReturnCode} from 'ffmpeg-kit-react-native'

const PRESET = 'faster'

export async function compressVideo(file: string) {
  const ext = file.split('.').pop()
  const newFile = file.replace(`.${ext}`, 'compressed.mp4')
  const result = await FFmpegKit.execute(
    `-i ${file} -c:v libx264 -crf 28 -preset ${PRESET} -b:v 4M -vf "scale='if(gt(a,1),min(1920,iw),-1)':'if(gt(a,1),-1,min(1920,ih))'" -t 90 -c:a aac -b:a 128k -movflags +faststart ${newFile}`,
  )

  return {
    uri: ReturnCode.isSuccess(await result.getReturnCode()) ? newFile : null,
    session: result,
  }
}
