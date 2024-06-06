import * as FileSystem from 'expo-file-system'
import {
  FFmpegKit,
  FFmpegSessionCompleteCallback,
  LogCallback,
  ReturnCode,
  StatisticsCallback,
} from 'ffmpeg-kit-react-native'

const PRESET = 'faster'

export async function compressVideo(
  file: string,
  callbacks?: {
    onLog?: LogCallback
    onStatistics?: StatisticsCallback
  },
) {
  const {onLog, onStatistics} = callbacks || {}

  const ext = file.split('.').pop()
  const newFile = file.replace(`.${ext}`, '.compressed.mp4')

  const result = await new Promise((resolve: FFmpegSessionCompleteCallback) =>
    FFmpegKit.executeAsync(
      `-i ${file} -c:v libx264 -crf 25 -preset ${PRESET} -b:v 4M -vf "scale='if(gt(a,1),min(1920,iw),-1)':'if(gt(a,1),-1,min(1920,ih))'" -t 90 -c:a aac -b:a 320k -movflags +faststart ${newFile}`,
      resolve,
      onLog,
      onStatistics,
    ),
  )

  const success = ReturnCode.isSuccess(await result.getReturnCode())

  if (success) {
    await FileSystem.deleteAsync(file)
  }

  return {
    uri: success ? newFile : null,
    session: result,
  }
}
