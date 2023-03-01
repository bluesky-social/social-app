import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import FollowButton from './FollowButton'

export function ProfileCard({
  handle,
  displayName,
  avatar,
  description,
  isFollowedBy,
  noBorder,
  renderButton,
}: {
  handle: string
  displayName?: string
  avatar?: string
  description?: string
  isFollowedBy?: boolean
  noBorder?: boolean
  renderButton?: () => JSX.Element
}) {
  const pal = usePalette('default')
  return (
    <Link
      style={[
        styles.outer,
        pal.view,
        pal.border,
        noBorder && styles.outerNoBorder,
      ]}
      href={`/profile/${handle}`}
      title={handle}
      noFeedback>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar
            size={40}
            displayName={displayName}
            handle={handle}
            avatar={avatar}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text
            type="lg"
            style={[s.bold, pal.text]}
            numberOfLines={1}
            lineHeight={1.2}>
            {displayName || handle}
          </Text>
          <Text type="md" style={[pal.textLight]} numberOfLines={1}>
            @{handle}
          </Text>
          {isFollowedBy && (
            <View style={s.flexRow}>
              <View style={[s.mt5, pal.btn, styles.pill]}>
                <Text type="xs">Follows You</Text>
              </View>
            </View>
          )}
        </View>
        {renderButton ? (
          <View style={styles.layoutButton}>{renderButton()}</View>
        ) : undefined}
      </View>
      {description ? (
        <View style={styles.details}>
          <Text style={pal.text} numberOfLines={4}>
            {description}
          </Text>
        </View>
      ) : undefined}
    </Link>
  )
}

export const ProfileCardWithFollowBtn = observer(
  ({
    did,
    declarationCid,
    handle,
    displayName,
    avatar,
    description,
    isFollowedBy,
  }: {
    did: string
    declarationCid: string
    handle: string
    displayName?: string
    avatar?: string
    description?: string
    isFollowedBy?: boolean
  }) => {
    const store = useStores()
    const isMe = store.me.handle === handle

    return (
      <ProfileCard
        handle={handle}
        displayName={displayName}
        avatar={avatar}
        description={description}
        isFollowedBy={isFollowedBy}
        renderButton={
          isMe
            ? undefined
            : () => <FollowButton did={did} declarationCid={declarationCid} />
        }
      />
    )
  },
)

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    paddingHorizontal: 6,
  },
  outerNoBorder: {
    borderTopWidth: 0,
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoutAvi: {
    width: 60,
    paddingLeft: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  avi: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  layoutContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  layoutButton: {
    paddingRight: 10,
  },
  details: {
    paddingLeft: 60,
    paddingRight: 10,
    paddingBottom: 10,
  },
  pill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  btn: {
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
    paddingHorizontal: 14,
  },
})
