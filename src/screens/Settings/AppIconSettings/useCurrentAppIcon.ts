import {useCallback, useMemo, useState} from 'react'
import * as DynamicAppIcon from '@mozzius/expo-dynamic-app-icon'
import {useFocusEffect} from '@react-navigation/native'

import {useAppIconSets} from '#/screens/Settings/AppIconSettings/useAppIconSets'

export function useCurrentAppIcon() {
  const appIconSets = useAppIconSets()
  const [currentAppIcon, setCurrentAppIcon] = useState(() =>
    DynamicAppIcon.getAppIcon(),
  )

  // refresh current icon when screen is focused
  useFocusEffect(
    useCallback(() => {
      setCurrentAppIcon(DynamicAppIcon.getAppIcon())
    }, []),
  )

  return useMemo(() => {
    return (
      appIconSets.defaults.find(i => i.id === currentAppIcon) ??
      appIconSets.core.find(i => i.id === currentAppIcon) ??
      appIconSets.defaults[0]
    )
  }, [appIconSets, currentAppIcon])
}
