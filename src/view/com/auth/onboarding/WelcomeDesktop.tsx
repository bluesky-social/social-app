import React from 'react'
import {StyleSheet, View} from 'react-native'
import {useMediaQuery} from 'react-responsive'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {TitleColumnLayout} from 'view/com/util/layouts/TitleColumnLayout'
import {Button} from 'view/com/util/forms/Button'
import {observer} from 'mobx-react-lite'

type Props = {
  next: () => void
  skip: () => void
}

export const WelcomeDesktop = observer(({next}: Props) => {
  const pal = usePalette('default')
  const horizontal = useMediaQuery({minWidth: 1300})
  const title = (
    <>
      <Text
        style={[
          pal.textLight,
          {
            fontSize: 36,
            fontWeight: '800',
            textAlign: horizontal ? 'right' : 'left',
          },
        ]}>
        Welcome to
      </Text>
      <Text
        style={[
          pal.link,
          {
            fontSize: 72,
            fontWeight: '800',
            textAlign: horizontal ? 'right' : 'left',
          },
        ]}>
        Bluesky
      </Text>
    </>
  )
  return (
    <TitleColumnLayout
      testID="welcomeOnboarding"
      title={title}
      horizontal={horizontal}
      titleStyle={horizontal ? {paddingBottom: 160} : undefined}>
      <View style={[styles.row]}>
        <FontAwesomeIcon icon={'globe'} size={36} color={pal.colors.link} />
        <View style={[styles.rowText]}>
          <Text type="xl-bold" style={[pal.text]}>
            Bluesky is public.
          </Text>
          <Text type="xl" style={[pal.text, s.pt2]}>
            Your posts, likes, and blocks are public. Mutes are private.
          </Text>
        </View>
      </View>
      <View style={[styles.row]}>
        <FontAwesomeIcon icon={'at'} size={36} color={pal.colors.link} />
        <View style={[styles.rowText]}>
          <Text type="xl-bold" style={[pal.text]}>
            Bluesky is open.
          </Text>
          <Text type="xl" style={[pal.text, s.pt2]}>
            Never lose access to your followers and data.
          </Text>
        </View>
      </View>
      <View style={[styles.row]}>
        <FontAwesomeIcon icon={'gear'} size={36} color={pal.colors.link} />
        <View style={[styles.rowText]}>
          <Text type="xl-bold" style={[pal.text]}>
            Bluesky is flexible.
          </Text>
          <Text type="xl" style={[pal.text, s.pt2]}>
            Choose the algorithms that power your experience with custom feeds.
          </Text>
        </View>
      </View>
      <View style={styles.spacer} />
      <View style={{flexDirection: 'row'}}>
        <Button onPress={next} testID="continueBtn">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 2,
              gap: 6,
            }}>
            <Text
              type="2xl-medium"
              style={{color: '#fff', position: 'relative', top: -1}}>
              Next
            </Text>
            <FontAwesomeIcon icon="angle-right" color="#fff" size={14} />
          </View>
        </Button>
      </View>
    </TitleColumnLayout>
  )
})

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    columnGap: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  rowText: {
    flex: 1,
  },
  spacer: {
    height: 20,
  },
})
