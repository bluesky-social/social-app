import {Activity, Children, useEffect, useId, useRef, useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {ReduceMotion, withTiming} from 'react-native-reanimated'

import {atoms as a} from '#/alf'
import {usePagerContext} from './context'

export function Content({
  children,
  manageDrawerGesture: _manageDrawerGesture,
  style,
  testID,
}: {
  children: React.ReactNode
  manageDrawerGesture?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  const {selectedPage, dragProgress, dragState, onPageSelected} =
    usePagerContext()
  const pages = Children.toArray(children)
  const activityName = useId()
  const previousPage = useRef(selectedPage)
  const [visitedPages, setVisitedPages] = useState(
    () => new Set([selectedPage]),
  )

  useEffect(() => {
    if (selectedPage !== previousPage.current) {
      previousPage.current = selectedPage
      dragState.set('settling')
      dragProgress.set(
        withTiming(
          selectedPage,
          {duration: 200, reduceMotion: ReduceMotion.System},
          finished => {
            'worklet'
            if (finished) dragState.set('idle')
          },
        ),
      )
      onPageSelected(selectedPage)
    }

    setVisitedPages(current => {
      if (current.has(selectedPage)) return current
      return new Set([...current, selectedPage])
    })
  }, [selectedPage, dragProgress, dragState, onPageSelected])

  return (
    <View testID={testID} style={[a.flex_1, style]}>
      {pages.map((page, pageIndex) => {
        if (!visitedPages.has(pageIndex) && selectedPage !== pageIndex) {
          return null
        }

        return (
          <Activity
            key={pageIndex}
            name={`${activityName}-${pageIndex}`}
            mode={selectedPage === pageIndex ? 'visible' : 'hidden'}>
            {page}
          </Activity>
        )
      })}
    </View>
  )
}
