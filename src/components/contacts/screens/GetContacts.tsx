import {Alert, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import * as Contacts from 'expo-contacts'
import * as Device from 'expo-device'
import {msg, t, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {atoms as a, tokens, useGutters} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {filterMatchedNumbers, normalizeContactBook} from '../contacts'
import {constructFullPhoneNumber} from '../phone-number'
import {type Action, type State} from '../state'

export function GetContacts({
  state,
  dispatch,
  onCancel,
}: {
  state: Extract<State, {step: '3: get contacts'}>
  dispatch: React.Dispatch<Action>
  onCancel: () => void
}) {
  const {_} = useLingui()
  const agent = useAgent()
  const insets = useSafeAreaInsets()
  const gutters = useGutters([0, 'wide'])

  const {mutate: uploadContacts, isPending: isUploadPending} = useMutation({
    mutationFn: async (contacts: Contacts.ExistingContact[]) => {
      const {phoneNumbers, indexToContactId} = normalizeContactBook(
        contacts,
        state.phoneCountryCode,
        constructFullPhoneNumber(state.phoneCountryCode, state.phoneNumber),
      )
      const res = await agent.app.bsky.contact.importContacts({
        token: state.token,
        contacts: phoneNumbers,
        deviceName: Device.deviceName || undefined,
      })

      return {
        matches: res.data.matchesAndContactIndexes,
        indexToContactId,
      }
    },
    onSuccess: (result, contacts) => {
      dispatch({
        type: 'SYNC_CONTACTS_SUCCESS',
        payload: {
          matches: result.matches.map(match => match.match),
          contacts: filterMatchedNumbers(
            contacts,
            result.matches,
            result.indexToContactId,
          ),
        },
      })
    },
    onError: err => {
      if (isNetworkError(err)) {
        Toast.show(
          _(
            msg`There was a problem with your internet connection, please try again`,
          ),
          {type: 'error'},
        )
      } else {
        logger.error('Error uploading contacts', {safeMessage: err})
        Toast.show(_(msg`Could not upload contacts. ${cleanError(err)}`), {
          type: 'error',
        })
      }
    },
  })

  const {mutate: getContacts, isPending: isGetContactsPending} = useMutation({
    mutationFn: async () => {
      let permissions = await Contacts.getPermissionsAsync()

      if (!permissions.granted && permissions.canAskAgain) {
        permissions = await Contacts.requestPermissionsAsync()
      }

      if (!permissions.granted) {
        throw new PermissionDeniedError()
      }

      const contacts = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
        ],
      })

      return contacts.data
    },
    onSuccess: contacts => {
      dispatch({
        type: 'GET_CONTACTS_SUCCESS',
        payload: {contacts},
      })
      uploadContacts(contacts)
    },
    onError: err => {
      if (err instanceof PermissionDeniedError) {
        showPermissionDeniedAlert()
      } else {
        logger.error('Error getting contacts', {safeMessage: err})
      }
    },
  })

  const isPending = isUploadPending || isGetContactsPending

  const style = [a.text_md, a.leading_snug, a.mt_md]

  return (
    <View style={[a.h_full]}>
      <Layout.Content contentContainerStyle={[gutters, a.flex_1, a.pt_xl]}>
        <Text style={[a.font_bold, a.text_3xl]}>
          <Trans>Share Your Contacts to Find Friends</Trans>
        </Text>
        <Text style={style}>
          <Trans>
            Bluesky helps friends find each other by creating an encoded digital
            fingerprint, called a "hash," and then looking for matching hashes.
          </Trans>
        </Text>
        <Text style={[style, a.mt_lg]}>
          &bull; <Trans>We only suggest follows if both people consent</Trans>
        </Text>
        <Text style={style}>
          &bull; <Trans>We never store plain phone numbers</Trans>
        </Text>
        <Text style={style}>
          &bull;{' '}
          <Trans>We save only non-matching hashes for future matching</Trans>
        </Text>
        <Text style={style}>
          &bull; <Trans>You can always opt out</Trans>
        </Text>
        <Text style={[style, a.mt_lg]}>
          <Trans>
            We apply the highest privacy standards just in case your contacts
            include minors. We never share or sell your contact information.
          </Trans>
        </Text>
      </Layout.Content>
      <View
        style={[
          gutters,
          a.pt_xs,
          {paddingBottom: Math.max(insets.bottom, tokens.space.xl)},
          a.gap_md,
        ]}>
        <Text style={[a.text_sm, a.pb_xs]}>
          <Trans>
            I consent to Bluesky using my contacts for mutual friend discovery
            and to retain hashed data for matching until I opt out.
          </Trans>
        </Text>
        <Button
          label={_(msg`Find my friends`)}
          size="large"
          color="primary"
          onPress={() => getContacts()}
          disabled={isPending}>
          {isUploadPending ? (
            <>
              <ButtonText>
                <Trans>Finding friends...</Trans>
              </ButtonText>
              <ButtonIcon icon={Loader} />
            </>
          ) : (
            <ButtonText>
              <Trans>Find my friends</Trans>
            </ButtonText>
          )}
        </Button>
        <Button
          label={_(msg`Cancel`)}
          size="large"
          color="secondary"
          onPress={onCancel}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}

class PermissionDeniedError extends Error {
  constructor() {
    super('Permission denied')
  }
}

function showPermissionDeniedAlert() {
  Alert.alert(
    t`You've denied access to your contacts`,
    t`You'll need to go to the app's settings and give permission if you want to use this feature.`,
    [
      {
        text: t`Ok`,
        style: 'default',
      },
    ],
  )
}
