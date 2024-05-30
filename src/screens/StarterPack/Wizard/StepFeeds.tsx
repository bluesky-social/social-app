import React from 'react'
import {ListRenderItemInfo, View} from 'react-native'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileFeedgensQuery} from 'state/queries/profile-feedgens'
import {useSession} from 'state/session'
import {List} from 'view/com/util/List'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

function renderItem({item}: ListRenderItemInfo<GeneratorView>) {
  return <FeedCard generator={item} />
}

export function StepFeeds() {
  const {currentAccount} = useSession()
  const {data} = useProfileFeedgensQuery(currentAccount!.did)
  const feeds = data?.pages.flatMap(page => page.feeds) || []

  return <List data={feeds} renderItem={renderItem} style={[a.flex_1]} />
}

function FeedCard({generator}: {generator: GeneratorView}) {
  const {_} = useLingui()
  const t = useTheme()
  const [state, dispatch] = useWizardState()

  const includesFeed = state.feedUris.includes(generator.uri)
  const onAdd = () => {
    if (includesFeed) {
      dispatch({type: 'RemoveFeed', uri: generator.uri})
    } else {
      dispatch({type: 'AddFeed', uri: generator.uri})
    }
  }

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.px_md,
        a.py_sm,
        a.border_b,
        a.gap_md,
        t.atoms.border_contrast_low,
      ]}>
      <UserAvatar type="algo" size={45} avatar={generator.avatar} />
      <View style={[a.flex_1]}>
        <Text style={[a.flex_1, a.font_bold, a.text_md]} numberOfLines={1}>
          {generator.displayName}
        </Text>
        <Text
          style={[a.flex_1, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {_(msg`Feed by @${generator.creator.handle}`)}
        </Text>
      </View>
      <Button
        label={includesFeed ? _(msg`Remove`) : _(msg`Add`)}
        variant="solid"
        color={includesFeed ? 'secondary' : 'primary'}
        size="small"
        style={{paddingVertical: 6}}
        onPress={onAdd}>
        <ButtonText>
          {includesFeed ? <Trans>Remove</Trans> : <Trans>Add</Trans>}
        </ButtonText>
      </Button>
    </View>
  )
}
