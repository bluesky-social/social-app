import React from 'react'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {View, StyleSheet} from 'react-native'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {FabPickable} from '../web-reader/DraggableFab'
import {ProfileViewBasic} from '@waverlyai/atproto-api/dist/client/types/app/bsky/actor/defs'
import {Link} from '../../util/Link'

interface Props {
  group: ProfileViewBasic
  isWaverlyRec?: boolean
}

export function CardHeader_Full({group, isWaverlyRec}: Props) {
  const pal = usePalette('default')
  const textStyle = isWaverlyRec ? pal.textInverted : pal.text

  return (
    <Link href={`/profile/${group.handle}`} asAnchor anchorNoUnderline>
      <FabPickable
        pickID={group.handle}
        data={group}
        type={'groupInfo'}
        zOrder={100}>
        <View style={styles.container}>
          <UserAvatar size={24} avatar={group.avatar} type="algo" />
          <Text type="sm-bold" style={textStyle}>
            {group.displayName ? group.displayName : group.handle}
          </Text>
        </View>
      </FabPickable>
    </Link>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
})
