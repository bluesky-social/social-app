import React from 'react'
import {View} from 'react-native'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {ZodError} from 'zod'

import * as Layout from '#/components/Layout'
import {atoms as a, useGutters} from '#/alf'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {useCreateVouch} from '#/state/queries/vouches/useCreateVouch'
import {Loader} from '#/components/Loader'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Admonition} from '#/components/Admonition'

export function Screen() {
  const baseGutters = useGutters(['base'])

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Create Vouch</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[baseGutters]}>
          <Form />
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

function Form() {
  const {_} = useLingui()
  const [subject, setSubject] = React.useState('')
  const [relationship, setRelationship] = React.useState('')
  const [errors, setErrors] = React.useState<string[]>([])

  const {mutateAsync: createVouch, isPending} = useCreateVouch()

  const onSubmit = async () => {
    setErrors([])
    try {
      await createVouch({subject, relationship})
    } catch (e: any) {
      if (e instanceof ZodError) {
        setErrors(e.errors.map(err => err.message))
      } else {
        setErrors([e.message])
      }
    }
  }

  return (
    <View style={[a.gap_md]}>
      <View style={[]}>
        <TextField.LabelText>
          <Trans>User DID</Trans>
        </TextField.LabelText>
        <TextField.Input label={_(msg`Subject`)} onChangeText={setSubject} />
      </View>
      <View style={[]}>
        <TextField.LabelText>
          <Trans>User DID</Trans>
        </TextField.LabelText>
        <TextField.Input
          label={_(msg`Relationship`)}
          onChangeText={setRelationship}
        />
      </View>

      <View style={[a.align_end, a.pt_sm]}>
        <Button
          label={_(msg`Create Vouch`)}
          size="large"
          color="primary"
          variant="solid"
          onPress={onSubmit}>
          <ButtonText>
            <Trans>Create</Trans>
          </ButtonText>
          <ButtonIcon icon={isPending ? Loader : Plus} />
        </Button>
      </View>

      {!!errors.length && (
        <View style={[a.gap_sm]}>
          {errors.map((error, i) => (
            <Admonition key={i} type="error">
              {' '}
              {error}{' '}
            </Admonition>
          ))}
        </View>
      )}
    </View>
  )
}
