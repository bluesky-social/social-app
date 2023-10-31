import React from 'react'
import {ModerationUI} from '@atproto/api'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {View, StyleSheet} from 'react-native'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {Image} from 'expo-image'
import {FabPickable} from '../web-reader/DraggableFab'
import {ProfileViewBasic} from '@waverlyai/atproto-api/dist/client/types/app/bsky/actor/defs'

interface Props {
  userName: string
  userInfo?: ProfileViewBasic
  avatar?: string | null
  moderation?: ModerationUI
  group?: ProfileViewBasic
  // group?: {
  //   // TODO: extend with DID
  //   displayName?: string
  //   handle: string
  //   avatar?: string | null
  //   moderation?: AvatarModeration
  // }
  isWaverlyRec?: boolean
}

export function CardHeader({
  userName,
  userInfo,
  avatar,
  moderation,
  group,
  isWaverlyRec,
}: Props) {
  const pal = usePalette('default')
  const textStyle = isWaverlyRec ? pal.textInverted : pal.text
  const groupMode = !group ? 'none' : group.avatar ? 'right' : 'below'

  return (
    <View style={styles.container}>
      <FabPickable
        pickID={'postAuthor'}
        data={userInfo}
        type={'userInfo'}
        zOrder={100}>
        {isWaverlyRec ? (
          <Image
            accessibilityIgnoresInvertColors
            source={require('../../../../../assets/images/WaverlyComma.png')}
            style={styles.waverlyAvatar}
            contentFit="cover"
          />
        ) : (
          <UserAvatar size={36} avatar={avatar} moderation={moderation} />
        )}
      </FabPickable>
      <View style={styles.textContainer}>
        <View style={styles.firstRow}>
          <Text type="sm-bold" style={textStyle}>
            {userName}
          </Text>
          {isWaverlyRec ? (
            <Text type="sm" style={textStyle}>
              &nbsp;recommends this
            </Text>
          ) : groupMode === 'right' ? (
            <Text type="sm" style={textStyle}>
              shared this Yesterday
            </Text>
          ) : (
            <Text type="sm" style={textStyle}>
              &nbsp;shared this
            </Text>
          )}
        </View>
        <View
          style={[
            styles.secondRow,
            groupMode === 'right' && styles.alignRight,
          ]}>
          {groupMode === 'below' ? (
            <>
              <Text type="xs" style={textStyle}>
                {group!.displayName ? group!.displayName : group!.handle}
              </Text>
              <Text type="xs" style={textStyle}>
                ·
              </Text>
            </>
          ) : groupMode === 'right' ? (
            <>
              <Text type="sm" style={textStyle}>
                in
              </Text>
              <Text type="sm-bold" style={textStyle}>
                {group!.displayName ? group!.displayName : group!.handle}
              </Text>
            </>
          ) : (
            <Text type="xs" style={textStyle}>
              Yesterday 10:49pm
            </Text>
          )}
        </View>
      </View>
      {groupMode === 'right' && (
        <FabPickable
          pickID={group!.handle}
          data={group}
          type={'groupInfo'}
          zOrder={100}>
          <UserAvatar
            size={36}
            avatar={group?.avatar}
            //moderation={group?.moderation}
            type="algo"
          />
        </FabPickable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  firstRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  waverlyAvatar: {
    width: 36,
    height: 36,
    borderRadius: Math.floor(36 / 5),
  },
})
