import {type ComAtprotoTempCheckHandleAvailability} from '@atproto/api'
import {Sift, SiftItem} from '@bsky.app/sift'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Portal} from '#/components/Portal'
import {Text} from '#/components/Typography'
import {type HandleSuggestionsProps} from './shared'

type Suggestion = ComAtprotoTempCheckHandleAvailability.Suggestion & {
  key: string
}

/**
 * Web: suggestions float in a Sift dropdown anchored to the handle input (see
 * StepHandle/index.tsx for the anchor wiring). Rendering through a Portal as an
 * absolutely-positioned popover means the requirements and Back/Next buttons
 * below the input don't shift as suggestions appear and disappear. See
 * index.native.tsx for the inline native variant.
 */
export function HandleSuggestions({
  suggestions,
  onSelect,
  sift,
}: HandleSuggestionsProps) {
  const t = useTheme()

  /*
   * Sift keys its list rows by `item.key`; the suggestion handle is unique
   * within a result set, so use it as the key.
   */
  const data: Suggestion[] = suggestions.map(s => ({...s, key: s.handle}))

  return (
    <Portal>
      <Sift<Suggestion>
        sift={sift}
        data={data}
        onSelect={onSelect}
        outerStyle={[a.rounded_sm, a.w_full, t.atoms.shadow_sm]}
        innerStyle={[
          a.overflow_hidden,
          a.rounded_sm,
          a.border,
          t.atoms.border_contrast_low,
          t.atoms.bg,
          a.w_full,
        ]}
        render={props => <SuggestionRow {...props} />}
      />
    </Portal>
  )
}

function SuggestionRow({
  active,
  isLast,
  props,
  item,
}: {
  active: boolean
  isLast: boolean
  props: {role: string; 'aria-selected': boolean; onPress: () => void}
  item: Suggestion
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <SiftItem
      {...props}
      aria-label={l({
        message: `Select ${item.handle}`,
        comment: `Accessibility label for a username suggestion in the account creation flow`,
      })}
      style={s => [
        a.w_full,
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.p_md,
        !isLast && a.border_b,
        t.atoms.border_contrast_low,
        (active || s.hovered || s.pressed) && t.atoms.bg_contrast_25,
      ]}>
      <Text style={[a.text_md]}>{item.handle}</Text>
      <Text style={[a.text_sm, {color: t.palette.positive_700}]}>
        <Trans comment="Shown next to an available username suggestion in the account creation flow">
          Available
        </Trans>
      </Text>
    </SiftItem>
  )
}
