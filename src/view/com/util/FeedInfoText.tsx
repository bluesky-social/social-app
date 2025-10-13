import {type StyleProp, type TextStyle} from 'react-native'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useFeedSourceInfoQuery} from '#/state/queries/feed'
import {atoms as a, platform} from '#/alf'
import {WebOnlyInlineLinkText} from '#/components/Link'
import {LoadingPlaceholder} from './LoadingPlaceholder'

export function FeedNameText({
  uri,
  href,
  numberOfLines,
  style,
}: {
  uri: string
  href: string
  numberOfLines?: number
  style?: StyleProp<TextStyle>
}) {
  const {data, isError} = useFeedSourceInfoQuery({uri})

  let inner
  if (data || isError) {
    const displayName = data?.displayName || uri.split('/').pop() || ''
    inner = (
      <WebOnlyInlineLinkText
        to={href}
        label={displayName}
        style={style}
        numberOfLines={numberOfLines}>
        {sanitizeDisplayName(displayName)}
      </WebOnlyInlineLinkText>
    )
  } else {
    inner = (
      <LoadingPlaceholder
        width={80}
        height={8}
        style={[
          a.ml_2xs,
          platform({
            native: [a.mt_2xs],
            web: [{top: -1}],
          }),
        ]}
      />
    )
  }

  return inner
}
