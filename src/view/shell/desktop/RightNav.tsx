import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {DesktopSearch} from './Search'
import {DesktopFeeds} from './Feeds'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'
import {FEEDBACK_FORM_URL, HELP_DESK_URL} from 'lib/constants'
import {s} from 'lib/styles'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {formatCount} from 'view/com/util/numeric/format'
import {useModalControls} from '#/state/modals'
import {useLingui} from '@lingui/react'
import {Plural, Trans, msg, plural} from '@lingui/macro'
import {useSession} from '#/state/session'
import {useInviteCodesQuery} from '#/state/queries/invites'

export function DesktopRightNav() {
  const pal = usePalette('default')
  const palError = usePalette('error')
  const {_} = useLingui()
  const {isSandbox, hasSession, currentAccount} = useSession()

  const {isTablet} = useWebMediaQueries()
  if (isTablet) {
    return null
  }

  return (
    <View style={[styles.rightNav, pal.view]}>
      <View style={{paddingVertical: 20}}>
        <DesktopSearch />

        {hasSession && (
          <View style={{paddingTop: 18, marginBottom: 18}}>
            <DesktopFeeds />
          </View>
        )}

        <View
          style={[
            styles.message,
            {
              paddingTop: hasSession ? 0 : 18,
            },
          ]}>
          {isSandbox ? (
            <View style={[palError.view, styles.messageLine, s.p10]}>
              <Text type="md" style={[palError.text, s.bold]}>
                SANDBOX. Posts and accounts are not permanent.
              </Text>
            </View>
          ) : undefined}
          <View style={[s.flexRow]}>
            {hasSession && (
              <>
                <TextLink
                  type="md"
                  style={pal.link}
                  href={FEEDBACK_FORM_URL({
                    email: currentAccount?.email,
                    handle: currentAccount?.handle,
                  })}
                  text={_(msg`Feedback`)}
                />
                <Text type="md" style={pal.textLight}>
                  &nbsp;&middot;&nbsp;
                </Text>
              </>
            )}
            <TextLink
              type="md"
              style={pal.link}
              href="https://blueskyweb.xyz/support/privacy-policy"
              text={_(msg`Privacy`)}
            />
            <Text type="md" style={pal.textLight}>
              &nbsp;&middot;&nbsp;
            </Text>
            <TextLink
              type="md"
              style={pal.link}
              href="https://blueskyweb.xyz/support/tos"
              text={_(msg`Terms`)}
            />
            <Text type="md" style={pal.textLight}>
              &nbsp;&middot;&nbsp;
            </Text>
            <TextLink
              type="md"
              style={pal.link}
              href={HELP_DESK_URL}
              text={_(msg`Help`)}
            />
          </View>
        </View>

        {hasSession && <InviteCodes />}
      </View>
    </View>
  )
}

function InviteCodes() {
  const pal = usePalette('default')
  const {openModal} = useModalControls()
  const {data: invites} = useInviteCodesQuery()
  const invitesAvailable = invites?.available?.length ?? 0
  const {_} = useLingui()

  const onPress = React.useCallback(() => {
    openModal({name: 'invite-codes'})
  }, [openModal])

  if (!invites) {
    return null
  }

  if (invites?.disabled) {
    return (
      <View style={[styles.inviteCodes, pal.border]}>
        <FontAwesomeIcon
          icon="ticket"
          style={[styles.inviteCodesIcon, pal.textLight]}
          size={16}
        />
        <Text type="md-medium" style={pal.textLight}>
          <Trans>
            Your invite codes are hidden when logged in using an App Password
          </Trans>
        </Text>
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={[styles.inviteCodes, pal.border]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={_(
        plural(invitesAvailable, {
          one: 'Invite codes: # available',
          other: 'Invite codes: # available',
        }),
      )}
      accessibilityHint={_(msg`Opens list of invite codes`)}>
      <FontAwesomeIcon
        icon="ticket"
        style={[
          styles.inviteCodesIcon,
          invitesAvailable > 0 ? pal.link : pal.textLight,
        ]}
        size={16}
      />
      <Text
        type="md-medium"
        style={invitesAvailable > 0 ? pal.link : pal.textLight}>
        <Plural
          value={formatCount(invitesAvailable)}
          one="# invite code available"
          other="# invite codes available"
        />
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  rightNav: {
    position: 'absolute',
    // @ts-ignore web only
    left: 'calc(50vw + 320px)',
    width: 304,
    maxHeight: '100%',
    overflowY: 'auto',
  },

  message: {
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  messageLine: {
    marginBottom: 10,
  },

  inviteCodes: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
  },
  inviteCodesIcon: {
    marginTop: 2,
    marginRight: 6,
    flexShrink: 0,
  },
})
