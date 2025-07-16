import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgeAssurance} from '#/state/ageAssurance/useAgeAssurance'
import {logger} from '#/state/ageAssurance/util'
import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {atoms as a, type ViewStyleProp} from '#/alf'
import {AgeAssuranceAdmonition} from '#/components/ageAssurance/AgeAssuranceAdmonition'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

export function AgeAssuranceDismissibleNotice({style}: ViewStyleProp & {}) {
  const {_} = useLingui()
  const {isReady, isDeclaredUnderage, isAgeRestricted, lastInitiatedAt} =
    useAgeAssurance()
  const {nux} = useNux(Nux.AgeAssuranceDismissibleNotice)
  const copy = useAgeAssuranceCopy()
  const {mutate: save, variables} = useSaveNux()
  const hidden = !!variables

  if (!isReady) return null
  if (isDeclaredUnderage) return null
  if (!isAgeRestricted) return null
  if (lastInitiatedAt) return null
  if (hidden) return null
  if (nux && nux.completed) return null

  return (
    <View style={style}>
      <View>
        <AgeAssuranceAdmonition>{copy.notice}</AgeAssuranceAdmonition>

        <Button
          label={_(msg`Don't show again`)}
          size="tiny"
          variant="solid"
          color="secondary_inverted"
          shape="round"
          onPress={() => {
            save({
              id: Nux.AgeAssuranceDismissibleNotice,
              completed: true,
              data: undefined,
            })
            logger.metric('ageAssurance:dismissSettingsNotice', {})
          }}
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
