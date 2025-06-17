import React from 'react'
import {Text} from 'react-native'
import {findNodeHandle, View} from 'react-native'
import {useSafeAreaFrame} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isIOS} from '#/platform/detection'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List, type ListRef} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Link as RNLink} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {ErrorState} from '../ErrorState'
import {type SectionRef} from './types'

interface LinksSectionProps {
  linkCards: Array<{url: string; text: string; emoji?: string}>
  loading: boolean
  error: Error | null
  scrollElRef: ListRef
  headerHeight: number
  isFocused: boolean
  setScrollViewTag: (tag: number | null) => void
}

export const ProfileLinksSection = React.forwardRef<
  SectionRef,
  LinksSectionProps
>(function LinksSection(
  {
    linkCards,
    loading,
    error,
    scrollElRef,
    headerHeight,
    isFocused,
    setScrollViewTag,
  },
  ref,
) {
  const {_} = useLingui()
  const t = useTheme()
  const {height: minHeight} = useSafeAreaFrame()

  React.useEffect(() => {
    if (isIOS && isFocused && scrollElRef.current) {
      const nativeTag = findNodeHandle(scrollElRef.current)
      setScrollViewTag(nativeTag)
    }
  }, [isFocused, scrollElRef, setScrollViewTag])

  React.useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      scrollElRef.current?.scrollToOffset({
        animated: true,
        offset: -headerHeight,
      })
    },
  }))

  return (
    <View style={{minHeight}}>
      {loading ? (
        <View style={[a.w_full, a.align_center, a.py_4xl]}>
          <Loader size="xl" />
        </View>
      ) : error || !linkCards ? (
        <View style={[a.w_full, a.align_center, a.py_4xl]}>
          <ErrorState
            error={error?.toString() || _(msg`Something went wrong.`)}
          />
        </View>
      ) : linkCards.length === 0 ? (
        <View style={[a.w_full, a.align_center, a.py_4xl]}>
          <EmptyState icon="link" message={_(msg`No links available.`)} />
        </View>
      ) : (
        <>
          <List
            ref={scrollElRef as ListRef}
            data={linkCards}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({item}) => (
              <View style={[a.align_center, a.p_md]}>
                <RNLink
                  to={item.url}
                  label={item.text}
                  variant="solid"
                  color="primary"
                  size="large"
                  shape="round"
                  style={[a.w_full, a.p_lg]}>
                  <Text style={[a.text_md, t.atoms.text_contrast_high]}>
                    {item.emoji ? `${item.emoji} ` : ''}
                    {item.text}
                  </Text>
                  <Text
                    style={[a.ml_md, a.text_sm, t.atoms.text_contrast_high]}>
                    ({item.url.replace('https://', '')})
                  </Text>
                </RNLink>
              </View>
            )}
            headerOffset={headerHeight}
          />
          <View style={[a.w_full, a.align_center, a.py_sm]}>
            <RNLink to="https://linkat.blue" label="linkat.blue">
              <Text style={[a.text_sm, t.atoms.text_contrast_low]}>
                {_(msg`Powered by linkat.blue`)}
              </Text>
            </RNLink>
          </View>
        </>
      )}
    </View>
  )
})
