import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {atoms as a, type ViewStyleProp} from '#/alf'
import {AgeAssuranceAdmonition} from '#/components/ageAssurance/AgeAssuranceAdmonition'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {useAgeInfo} from '#/components/ageAssurance/useAgeInfo'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

export function AgeAssuranceDismissableNotice({style}: ViewStyleProp & {}) {
  const {_} = useLingui()
  const {isLoaded, isUnderage, assurance} = useAgeInfo()
  const {nux} = useNux(Nux.AgeAssurancePrompt)
  const copy = useAgeAssuranceCopy()
  const {mutate: save, variables} = useSaveNux()
  const hidden = !!variables

  if (!isLoaded) return null
  if (isUnderage) return null
  if (!assurance.isAgeRestricted) return null
  if (assurance.lastInitiatedAt) return null
  if (hidden) return null
  if (nux && nux.completed) return null

  return (
    <View style={style}>
      <View style={[a.relative]}>
        <AgeAssuranceAdmonition>{copy.notice}</AgeAssuranceAdmonition>

        <Button
          label={_(msg`Don't show again`)}
          size="tiny"
          variant="solid"
          color="secondary_inverted"
          shape="round"
          onPress={() =>
            save({
              id: Nux.AgeAssurancePrompt,
              completed: true,
              data: undefined,
            })
          }
          style={[
            a.absolute,
            {
              top: 12,
              right: 12,
            },
          ]}>
          <ButtonIcon icon={X} />
        </Button>
      </View>
    </View>
  )
}
