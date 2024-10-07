import React, {memo} from 'react'
import {StyleSheet, View} from 'react-native'
import {
  AppBskyActorDefs,
  AppBskyLabelerDefs,
  ModerationOpts,
  RichText as RichTextAPI,
} from '@atproto/api'

import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {useTheme} from '#/alf'
import {ProfileHeaderLabeler} from './ProfileHeaderLabeler'
import {ProfileHeaderStandard} from './ProfileHeaderStandard'

let ProfileHeaderLoading = (_props: {}): React.ReactNode => {
  const t = useTheme()
  return (
    <View style={t.atoms.bg}>
      <LoadingPlaceholder width="100%" height={150} style={{borderRadius: 0}} />
      <View
        style={[
          t.atoms.bg,
          {borderColor: t.atoms.bg.backgroundColor},
          styles.avi,
        ]}>
        <LoadingPlaceholder width={90} height={90} style={styles.br45} />
      </View>
      <View style={styles.content}>
        <View style={[styles.buttonsLine]}>
          <LoadingPlaceholder width={140} height={34} style={styles.br50} />
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
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 2,
  },
  content: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  buttonsLine: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  br45: {borderRadius: 45},
  br50: {borderRadius: 50},
})
