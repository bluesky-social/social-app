import {useContext} from 'react'
import {Alert, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import * as Contacts from 'expo-contacts'
import type AtpAgent from '@atproto/api'
import {
  type AppBskyActorProfile,
  AppBskyContactImportContacts,
  type Un$Typed,
} from '@atproto/api'
import {msg, t} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {uploadBlob} from '#/lib/api'
import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {findContactsStatusQueryKey} from '#/state/queries/find-contacts'
import {useAgent} from '#/state/session'
import {
  Context as OnboardingContext,
  type OnboardingAction,
  type OnboardingState,
} from '#/screens/Onboarding/state'
import {atoms as a, ios, tokens, useGutters} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {
  contactsWithPhoneNumbersOnly,
  filterMatchedNumbers,
  getMatchedContacts,
  normalizeContactBook,
} from '../contacts'
import {constructFullPhoneNumber} from '../phone-number'
import {type Action, type State} from '../state'

const MAX_UPLOAD_COUNT = 1000

export function GetContacts({
  state,
  dispatch,
  onCancel,
  context,
}: {
  state: Extract<State, {step: '3: get contacts'}>
  dispatch: React.ActionDispatch<[Action]>
  onCancel: () => void
  context: 'Onboarding' | 'Standalone'
}) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const agent = useAgent()
  const insets = useSafeAreaInsets()
  const gutters = useGutters([0, 'wide'])
  const queryClient = useQueryClient()
  const maybeOnboardingContext = useContext(OnboardingContext)

  const {mutate: uploadContacts, isPending: isUploadPending} = useMutation({
    mutationFn: async (contacts: Contacts.ExistingContact[]) => {
      /**
       * `importContacts` triggers a notification for the people you match with,
       * however we prevent notifications coming from users without profiles.
       * If you're using this as the onboarding flow, we need to create a profile
       * record before this.
       *
       * When you finish onboarding, we'll upsert again - bit wasteful but fine.
       */
      if (context === 'Onboarding' && maybeOnboardingContext) {
        try {
          await createProfileRecord(agent, maybeOnboardingContext)
        } catch (error) {
          logger.debug('Error creating profile record:', {safeMessage: error})
        }
      }

      const {phoneNumbers, indexToContactId} = normalizeContactBook(
        contacts,
        state.phoneCountryCode,
        constructFullPhoneNumber(state.phoneCountryCode, state.phoneNumber),
      )

      if (phoneNumbers.length > 0) {
        const res = await agent.app.bsky.contact.importContacts({
          token: state.token,
          contacts: phoneNumbers.slice(0, MAX_UPLOAD_COUNT),
        })

        return {
          matches: res.data.matchesAndContactIndexes,
          indexToContactId,
        }
      } else {
        return {
          matches: [],
          indexToContactId,
        }
      }
    },
    onSuccess: (result, contacts) => {
      if (context === 'Onboarding') {
        ax.metric('onboarding:contacts:contactsShared', {})
      }
      if (result.matches.length > 0) {
        ax.metric('contacts:import:success', {
          contactCount: contacts.length,
          matchCount: result.matches.length,
          entryPoint: context,
        })
      } else {
        ax.metric('contacts:import:failure', {
          reason: 'noValidNumbers',
          entryPoint: context,
        })
      }
      dispatch({
        type: 'SYNC_CONTACTS_SUCCESS',
        payload: {
          matches: getMatchedContacts(
            contacts,
            result.matches,
            result.indexToContactId,
          ),
          contacts: filterMatchedNumbers(
            contacts,
            result.matches,
            result.indexToContactId,
          ),
        },
      })
      queryClient.invalidateQueries({
        queryKey: findContactsStatusQueryKey,
      })
    },
    onError: err => {
      ax.metric('contacts:import:failure', {
        reason: isNetworkError(err) ? 'networkError' : 'unknown',
        entryPoint: context,
      })
      if (isNetworkError(err)) {
        Toast.show(
          _(
            msg`There was a problem with your internet connection, please try again`,
          ),
          {type: 'error'},
        )
      } else if (
        err instanceof AppBskyContactImportContacts.TooManyContactsError
      ) {
        Toast.show(
          _(
            msg`Too many contacts - you've exceeded the number of contacts you can import to find your friends`,
          ),
          {type: 'error'},
        )
      } else if (
        err instanceof AppBskyContactImportContacts.InvalidTokenError
      ) {
        Toast.show(
          _(
            msg`Could not upload contacts. You need to re-verify your phone number to proceed`,
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

      ax.metric('contacts:permission:request', {
        status: permissions.granted ? 'granted' : 'denied',
        accessLevelIOS: ios(permissions.accessPrivileges),
      })

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

      return contactsWithPhoneNumbersOnly(contacts.data)
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
      <Layout.Content
        contentContainerStyle={[gutters, a.flex_1, a.pt_xl]}
        bounces={false}>
        <Text style={[a.font_bold, a.text_3xl]}>
          <Trans>Share your contacts to find friends</Trans>
        </Text>
        <Text style={style}>
          <Trans>
            Bluesky helps friends find each other by creating an encoded digital
            fingerprint, called a "hash", and then looking for matching hashes.
          </Trans>
        </Text>
        <Text style={style}>
          &bull; <Trans>We never keep plain phone numbers</Trans>
        </Text>
        <Text style={style}>
          &bull; <Trans>We delete hashes after matches are made</Trans>
        </Text>
        <Text style={style}>
          &bull; <Trans>We only suggest follows if both people consent</Trans>
        </Text>
        <Text style={style}>
          &bull; <Trans>You can always opt out and delete your data</Trans>
        </Text>
        <Text style={[style, a.mt_lg]}>
          <Trans>
            We apply the highest privacy standards, and never share or sell your
            contact information.
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
    t`You'll need to go to the System Settings for Bluesky and give permission if you want to use this feature.`,
    [
      {
        text: t`OK`,
        style: 'default',
      },
    ],
  )
}

/**
 * Copied from `#/screens/Onboarding/StepFinished/index.tsx`
 */
async function createProfileRecord(
  agent: AtpAgent,
  onboardingContext: {
    state: OnboardingState
    dispatch: React.Dispatch<OnboardingAction>
  },
) {
  const profileStepResults = onboardingContext.state.profileStepResults
  const {imageUri, imageMime} = profileStepResults
  const blobPromise =
    imageUri && imageMime ? uploadBlob(agent, imageUri, imageMime) : undefined

  await agent.upsertProfile(async existing => {
    let next: Un$Typed<AppBskyActorProfile.Record> = existing ?? {}

    if (blobPromise) {
      const res = await blobPromise
      if (res.data.blob) {
        next.avatar = res.data.blob
      }
    }

    next.displayName = ''

    next.createdAt = new Date().toISOString()
    return next
  })
}
