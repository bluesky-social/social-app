import {View} from 'react-native'
import {CircularProgressbar, buildStyles} from 'react-circular-progressbar'

const ProgressCircle = ({
  color,
  progress,
}: {
  color?: string
  progress: number
}) => {
  return (
    <View style={{width: 20, height: 20}}>
      <CircularProgressbar
        value={progress * 100}
        styles={buildStyles({pathColor: color || '#00f'})}
      />
    </View>
  )
}
export default ProgressCircle
