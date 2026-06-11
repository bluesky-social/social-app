import {useState} from 'react'
import {View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {sanitizeHandle} from '#/lib/strings/handles'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUp,
} from '#/components/icons/Chevron'
import {CodeBrackets_Stroke2_Corner2_Rounded as CodeIcon} from '#/components/icons/CodeBrackets'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {type CustomEmbedComponentProps} from '#/features/customEmbeds/types'
import {CodeBlock, useCodePanelColor} from './CodeBlock'
import {parseTangledString} from './detect'
import {useTangledStringQuery} from './queries'

// Collapsed cards show a short preview; "Show more" expands the whole file into
// a viewport capped at SCROLL_LINES tall that scrolls internally.
const PREVIEW_LINES = 10
const SCROLL_LINES = 25

export function TangledStringEmbed({
  view,
  onOpen,
  style,
}: CustomEmbedComponentProps) {
  const t = useTheme()
  const {t: l} = useLingui()
  const playHaptic = useHaptics()
  const panelBg = useCodePanelColor()
  const [expanded, setExpanded] = useState(false)

  const ref = parseTangledString(view.uri)
  const query = useTangledStringQuery({
    actor: ref?.actor ?? '',
    rkey: ref?.rkey ?? '',
    enabled: !!ref,
  })
  const value = query.data?.value
  const author = query.data?.author
  const code = value?.contents ?? ''
  const filename = value?.filename || view.title || l`Snippet`
  const lineCount = code ? code.split('\n').length : 0
  const canExpand = lineCount > PREVIEW_LINES

  const onPressCard = () => {
    playHaptic('Light')
    onOpen?.()
  }

  return (
    <View
      style={[
        a.flex_col,
        a.rounded_md,
        a.overflow_hidden,
        a.w_full,
        a.border,
        t.atoms.border_contrast_low,
        {backgroundColor: panelBg},
        style,
      ]}>
      {/* Header: filename + source */}
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.px_md, a.py_sm]}>
        <CodeIcon size="sm" style={t.atoms.text_contrast_medium} />
        <Link
          label={l`Open ${filename} on ${toNiceDomain(view.uri)}`}
          to={view.uri}
          shouldProxy
          onPress={onPressCard}
          style={[a.flex_1, {minWidth: 0}]}>
          <Text
            numberOfLines={1}
            style={[a.text_sm, a.font_bold, a.leading_snug]}>
            {filename}
          </Text>
        </Link>
        <Link
          label={l`Open on ${toNiceDomain(view.uri)}`}
          to={view.uri}
          shouldProxy
          onPress={onPressCard}>
          <Text style={[a.text_xs, t.atoms.text_contrast_low]}>
            {toNiceDomain(view.uri)}
          </Text>
        </Link>
      </View>

      {/* Code preview */}
      {query.isLoading ? (
        <View style={[a.py_lg, a.align_center]}>
          <Loader size="md" />
        </View>
      ) : query.isError || !code ? (
        <View style={[a.px_md, a.py_md]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            <Trans>Couldn't load this snippet.</Trans>
          </Text>
        </View>
      ) : (
        <CodeBlock
          code={code}
          filename={value?.filename}
          maxLines={expanded ? undefined : PREVIEW_LINES}
          maxHeightLines={expanded ? SCROLL_LINES : undefined}
        />
      )}

      {code ? <Divider /> : null}

      {/* Footer: author byline | expand/collapse | line count */}
      {(author || lineCount > 0) && (
        <View style={[a.flex_row, a.align_center, a.gap_sm, a.px_md, a.py_xs]}>
          {/* left: author byline */}
          <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_xs]}>
            {author ? (
              <>
                <UserAvatar type="user" size={20} avatar={author.avatar} />
                <Text
                  numberOfLines={1}
                  style={[a.text_sm, t.atoms.text_contrast_medium, a.flex_1]}>
                  {author.displayName || sanitizeHandle(author.handle, '@')}
                </Text>
              </>
            ) : null}
          </View>

          {/* center: expand/collapse */}
          {canExpand && (
            <Button
              label={expanded ? l`Show less` : l`Show more`}
              onPress={() => setExpanded(e => !e)}
              size="small"
              color="secondary"
              variant="ghost">
              <ButtonText>
                {expanded ? <Trans>Show less</Trans> : <Trans>Show more</Trans>}
              </ButtonText>
              <ButtonIcon icon={expanded ? ChevronUp : ChevronDown} />
            </Button>
          )}

          {/* right: line count */}
          <View style={[a.flex_1, a.align_end]}>
            {lineCount > 0 ? (
              <Link
                label={l`Open on ${toNiceDomain(view.uri)}`}
                to={view.uri}
                shouldProxy
                onPress={onPressCard}>
                <Text style={[a.text_xs, t.atoms.text_contrast_low]}>
                  <Plural value={lineCount} one="# line" other="# lines" />
                </Text>
              </Link>
            ) : null}
          </View>
        </View>
      )}
    </View>
  )
}
