import {useState} from 'react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {Haptics} from '#/view/screens/Storybook/Haptics'
import {ListContained} from '#/view/screens/Storybook/ListContained'
import {SharePlatforms} from '#/view/screens/Storybook/SharePlatforms'
import {Button, ButtonText} from '#/components/Button'
import {
  useDeviceGeolocationApi,
  useRequestDeviceGeolocation,
} from '#/geolocation'

export default function DeviceToolsPage() {
  const [showContainedList, setShowContainedList] = useState(false)
  const navigation = useNavigation<NavigationProp>()
  const requestDeviceGeolocation = useRequestDeviceGeolocation()
  const {setDeviceGeolocation} = useDeviceGeolocationApi()

  return (
    <>
      <Haptics />
      <SharePlatforms />
      <Button
        color="primary"
        size="small"
        onPress={() => navigation.navigate('SharedPreferencesTester')}
        label="Open Shared Prefs Tester"
        testID="sharedPrefsTestOpenBtn">
        <ButtonText>Open Shared Prefs Tester</ButtonText>
      </Button>
      <Button
        color="primary_subtle"
        size="large"
        onPress={() => {
          void requestDeviceGeolocation().then(req => {
            if (req.granted && req.location) {
              setDeviceGeolocation(req.location)
            }
          })
        }}
        label="Get GPS Location">
        <ButtonText>Get GPS Location</ButtonText>
      </Button>
      <Button
        color="primary"
        size="large"
        label={
          showContainedList ? 'Hide Contained List' : 'Show Contained List'
        }
        onPress={() => setShowContainedList(value => !value)}>
        <ButtonText>
          {showContainedList ? 'Hide Contained List' : 'Show Contained List'}
        </ButtonText>
      </Button>
      {showContainedList && <ListContained />}
    </>
  )
}
