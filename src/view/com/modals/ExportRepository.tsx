import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from '../util/text/Text'
import {colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {Button} from '../util/forms/Button'
import {TextLink} from '../util/Link'
import {getAgent} from '#/state/session'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

export const snapPoints = ['50%', '90%']

function carDownloadURL() {
  const agent = getAgent()
  // eg: https://bsky.social/xrpc/com.atproto.sync.getRepo?did=did:plc:ewvi7nxzyoun6zhxrhs64oiz
  return agent.pdsUrl + 'xrpc/com.atproto.sync.getRepo?did=' + agent.session.did
}

export function Component() {
  return <Inner />
}

function Inner() {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {closeModal} = useModalControls()
  const {isTabletOrDesktop} = useWebMediaQueries()

  return (
    <View style={[styles.container, pal.view]} testID="exportRepositoryModal">
      <View style={styles.titleSection}>
        <Text type="title-lg" style={[pal.text, styles.title]}>
          <Trans>Export Repository</Trans>
        </Text>
      </View>

      <Text type="lg" style={[styles.description, pal.text]}>
        <Trans>
          Your account repository, containing all data records, can be
          downloaded as a "CAR" file. This file does not include media embeds,
          such as images, which must be fetched separately.
        </Trans>
      </Text>

      <Text type="lg" style={[styles.description, pal.text]}>
        <Trans>You can read more about repository exports in</Trans>
        <TextLink
          type="md"
          style={pal.link}
          href="https://atproto.com/blog/repo-export"
          text={_(msg` this blog post`)}
        />
      </Text>

      <Text type="lg" style={[styles.description, pal.text]}>
        <TextLink
          type="md"
          style={pal.link}
          href={carDownloadURL()}
          text={_(msg`Download CAR file`)}
        />
      </Text>

      <View style={styles.flex1} />
      <View
        style={[
          styles.btnContainer,
          isTabletOrDesktop && styles.btnContainerDesktop,
        ]}>
        <Button
          type="primary"
          label={_(msg`Done`)}
          style={styles.btn}
          labelStyle={styles.btnLabel}
          onPress={closeModal}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isWeb ? 0 : 40,
  },
  titleSection: {
    paddingTop: isWeb ? 0 : 4,
    paddingBottom: isWeb ? 14 : 10,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  error: {
    borderRadius: 6,
    marginTop: 10,
  },
  dateInputButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.blue3,
  },
  btnContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
})
