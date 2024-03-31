import React, {memo} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyLabelerDefs,
  ModerationOpts,
  RichText as RichTextAPI,
} from '@atproto/api'

import {usePalette} from 'lib/hooks/usePalette'
import {LoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'
import {ProfileHeaderLabeler} from './ProfileHeaderLabeler'
import {ProfileHeaderStandard} from './ProfileHeaderStandard'

let ProfileHeaderLoading = (_props: {}): React.ReactNode => {
  const pal = usePalette('default')
  return (
    <View style={pal.view}>
      <LoadingPlaceholder width="100%" height={150} style={{borderRadius: 0}} />
      <View
        style={[pal.view, {borderColor: pal.colors.background}, styles.avi]}>
        <LoadingPlaceholder width={80} height={80} style={styles.br40} />
      </View>
      <View style={styles.content}>
        <View style={[styles.buttonsLine]}>
          <LoadingPlaceholder width={167} height={31} style={styles.br50} />
        </View>
      </View>
    </View>
  )
}
ProfileHeaderLoading = memo(ProfileHeaderLoading)
export {ProfileHeaderLoading}

interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed
  labeler: AppBskyLabelerDefs.LabelerViewDetailed | undefined
  descriptionRT: RichTextAPI | null
  moderationOpts: ModerationOpts
  hideBackButton?: boolean
  isPlaceholderProfile?: boolean
}

let ProfileHeader = (props: Props): React.ReactNode => {
  if (props.profile.associated?.labeler) {
    if (!props.labeler) {
      return <ProfileHeaderLoading />
    }
    return <ProfileHeaderLabeler {...props} labeler={props.labeler} />
  }
  return <ProfileHeaderStandard {...props} />
}
ProfileHeader = memo(ProfileHeader)
export {ProfileHeader}

const styles = StyleSheet.create({
  avi: {
    position: 'absolute',
    top: 110,
    left: 10,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  buttonsLine: {
    flexDirection: 'row',
    marginLeft: 'auto',
    marginBottom: 12,
  },
  br40: {borderRadius: 40},
  br50: {borderRadius: 50},
})
