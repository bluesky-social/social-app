import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Button} from 'view/com/util/forms/Button'
import {observer} from 'mobx-react-lite'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {isDesktopWeb} from 'platform/detection'

type Props = {
  next: () => void
  skip: () => void
}

export const WelcomeMobile = observer(({next, skip}: Props) => {
  const pal = usePalette('default')

  return (
    <View style={[styles.container]} testID="welcomeOnboarding">
      <ViewHeader
        showOnDesktop
        showBorder={false}
        showBackButton={false}
        title=""
        renderButton={() => {
          return (
            <Pressable
              accessibilityRole="button"
              style={[s.flexRow, s.alignCenter]}
              onPress={skip}>
              <Text style={[pal.link]}>Skip</Text>
              <FontAwesomeIcon
                icon={'chevron-right'}
                size={14}
                color={pal.colors.link}
              />
            </Pressable>
          )
        }}
      />
      <View>
        <Text style={[pal.text, styles.title]}>
          Welcome to{' '}
          <Text style={[pal.text, pal.link, styles.title]}>Bluesky</Text>
        </Text>
        <View style={styles.spacer} />
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'globe'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is public.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              Your posts, likes, and blocks are public. Mutes are private.
            </Text>
          </View>
        </View>
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'at'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is open.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              Never lose access to your followers and data.
            </Text>
          </View>
        </View>
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'gear'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is flexible.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              Choose the algorithms that power your experience with custom
              feeds.
            </Text>
          </View>
        </View>
      </View>

      <Button
        onPress={next}
        label="Continue"
        testID="continueBtn"
        labelStyle={styles.buttonText}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: isDesktopWeb ? 30 : 60,
    marginHorizontal: 16,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
  },
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
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 4,
  },
})
