import React, {useState} from 'react'
import Clipboard from '@react-native-clipboard/clipboard'
import * as Toast from '../util/Toast'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ScrollView, TextInput} from './util'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {SelectableBtn} from '../util/forms/SelectableBtn'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {useStores} from 'state/index'
import {ServiceDescription} from 'state/models/session'
import {s} from 'lib/styles'
import {createFullHandle, makeValidHandle} from 'lib/strings/handles'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {useAnalytics} from 'lib/analytics/analytics'
import {cleanError} from 'lib/strings/errors'

export const snapPoints = ['100%']

export function Component({onChanged}: {onChanged: () => void}) {
  const store = useStores()
  const [error, setError] = useState<string>('')
  const pal = usePalette('default')
  const {track} = useAnalytics()

  const [isProcessing, setProcessing] = useState<boolean>(false)
  const [retryDescribeTrigger, setRetryDescribeTrigger] = React.useState<any>(
    {},
  )
  const [serviceDescription, setServiceDescription] = React.useState<
    ServiceDescription | undefined
  >(undefined)
  const [userDomain, setUserDomain] = React.useState<string>('')
  const [isCustom, setCustom] = React.useState<boolean>(false)
  const [handle, setHandle] = React.useState<string>('')
  const [canSave, setCanSave] = React.useState<boolean>(false)

  // init
  // =
  React.useEffect(() => {
    let aborted = false
    setError('')
    setServiceDescription(undefined)
    setProcessing(true)

    // load the service description so we can properly provision handles
    store.session.describeService(String(store.agent.service)).then(
      desc => {
        if (aborted) {
          return
        }
        setServiceDescription(desc)
        setUserDomain(desc.availableUserDomains[0])
        setProcessing(false)
      },
      err => {
        if (aborted) {
          return
        }
        setProcessing(false)
        store.log.warn(
          `Failed to fetch service description for ${String(
            store.agent.service,
          )}`,
          err,
        )
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      },
    )
    return () => {
      aborted = true
    }
  }, [store.agent.service, store.session, store.log, retryDescribeTrigger])

  // events
  // =
  const onPressCancel = React.useCallback(() => {
    store.shell.closeModal()
  }, [store])
  const onPressRetryConnect = React.useCallback(
    () => setRetryDescribeTrigger({}),
    [setRetryDescribeTrigger],
  )
  const onToggleCustom = React.useCallback(() => {
    // toggle between a provided domain vs a custom one
    setHandle('')
    setCanSave(false)
    setCustom(!isCustom)
    track(
      isCustom ? 'EditHandle:ViewCustomForm' : 'EditHandle:ViewProvidedForm',
    )
  }, [setCustom, isCustom, track])
  const onPressSave = React.useCallback(async () => {
    setError('')
    setProcessing(true)
    try {
      track('EditHandle:SetNewHandle')
      const newHandle = isCustom ? handle : createFullHandle(handle, userDomain)
      store.log.debug(`Updating handle to ${newHandle}`)
      await store.agent.updateHandle({
        handle: newHandle,
      })
      store.shell.closeModal()
      onChanged()
    } catch (err: any) {
      setError(cleanError(err))
      store.log.error('Failed to update handle', {handle, err})
    } finally {
      setProcessing(false)
    }
  }, [
    setError,
    setProcessing,
    handle,
    userDomain,
    store,
    isCustom,
    onChanged,
    track,
  ])

  // rendering
  // =
  return (
    <View style={[s.flex1, pal.view]}>
      <View style={[styles.title, pal.border]}>
        <View style={styles.titleLeft}>
          <TouchableOpacity
            onPress={onPressCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel change handle"
            accessibilityHint="Exits handle change process"
            onAccessibilityEscape={onPressCancel}>
            <Text type="lg" style={pal.textLight}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
        <Text
          type="2xl-bold"
          style={[styles.titleMiddle, pal.text]}
          numberOfLines={1}>
          Change Handle
        </Text>
        <View style={styles.titleRight}>
          {isProcessing ? (
            <ActivityIndicator />
          ) : error && !serviceDescription ? (
            <TouchableOpacity
              testID="retryConnectButton"
              onPress={onPressRetryConnect}
              accessibilityRole="button"
              accessibilityLabel="Retry change handle"
              accessibilityHint={`Retries handle change to ${handle}`}>
              <Text type="xl-bold" style={[pal.link, s.pr5]}>
                Retry
              </Text>
            </TouchableOpacity>
          ) : canSave ? (
            <TouchableOpacity
              onPress={onPressSave}
              accessibilityRole="button"
              accessibilityLabel="Save handle change"
              accessibilityHint={`Saves handle change to ${handle}`}>
              <Text type="2xl-medium" style={pal.link}>
                Save
              </Text>
            </TouchableOpacity>
          ) : undefined}
        </View>
      </View>
      <ScrollView style={styles.inner}>
        {error !== '' && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={error} />
          </View>
        )}

        {isCustom ? (
          <CustomHandleForm
            handle={handle}
            isProcessing={isProcessing}
            canSave={canSave}
            onToggleCustom={onToggleCustom}
            setHandle={setHandle}
            setCanSave={setCanSave}
            onPressSave={onPressSave}
          />
        ) : (
          <ProvidedHandleForm
            handle={handle}
            userDomain={userDomain}
            isProcessing={isProcessing}
            onToggleCustom={onToggleCustom}
            setHandle={setHandle}
            setCanSave={setCanSave}
          />
        )}
      </ScrollView>
    </View>
  )
}

/**
 * The form for using a domain allocated by the PDS
 */
function ProvidedHandleForm({
  userDomain,
  handle,
  isProcessing,
  setHandle,
  onToggleCustom,
  setCanSave,
}: {
  userDomain: string
  handle: string
  isProcessing: boolean
  setHandle: (v: string) => void
  onToggleCustom: () => void
  setCanSave: (v: boolean) => void
}) {
  const pal = usePalette('default')
  const theme = useTheme()

  // events
  // =
  const onChangeHandle = React.useCallback(
    (v: string) => {
      const newHandle = makeValidHandle(v)
      setHandle(newHandle)
      setCanSave(newHandle.length > 0)
    },
    [setHandle, setCanSave],
  )

  // rendering
  // =
  return (
    <>
      <View style={[pal.btn, styles.textInputWrapper]}>
        <FontAwesomeIcon
          icon="at"
          style={[pal.textLight, styles.textInputIcon]}
        />
        <TextInput
          testID="setHandleInput"
          style={[pal.text, styles.textInput]}
          placeholder="e.g. alice"
          placeholderTextColor={pal.colors.textLight}
          autoCapitalize="none"
          keyboardAppearance={theme.colorScheme}
          value={handle}
          onChangeText={onChangeHandle}
          editable={!isProcessing}
          accessible={true}
          accessibilityLabel="Handle"
          accessibilityHint="Sets Bluesky username"
        />
      </View>
      <Text type="md" style={[pal.textLight, s.pl10, s.pt10]}>
        Your full handle will be{' '}
        <Text type="md-bold" style={pal.textLight}>
          @{createFullHandle(handle, userDomain)}
        </Text>
      </Text>
      <TouchableOpacity
        onPress={onToggleCustom}
        accessibilityRole="button"
        accessibilityHint="Hosting provider"
        accessibilityLabel="Opens modal for using custom domain">
        <Text type="md-medium" style={[pal.link, s.pl10, s.pt5]}>
          I have my own domain
        </Text>
      </TouchableOpacity>
    </>
  )
}

/**
 * The form for using a custom domain
 */
function CustomHandleForm({
  handle,
  canSave,
  isProcessing,
  setHandle,
  onToggleCustom,
  onPressSave,
  setCanSave,
}: {
  handle: string
  canSave: boolean
  isProcessing: boolean
  setHandle: (v: string) => void
  onToggleCustom: () => void
  onPressSave: () => void
  setCanSave: (v: boolean) => void
}) {
  const store = useStores()
  const pal = usePalette('default')
  const palSecondary = usePalette('secondary')
  const palError = usePalette('error')
  const theme = useTheme()
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [error, setError] = React.useState<string>('')
  const [isDNSForm, setDNSForm] = React.useState<boolean>(true)
  // events
  // =
  const onPressCopy = React.useCallback(() => {
    Clipboard.setString(`did=${store.me.did}`)
    Toast.show('Copied to clipboard')
  }, [store.me.did])
  const onChangeHandle = React.useCallback(
    (v: string) => {
      setHandle(v)
      setCanSave(false)
    },
    [setHandle, setCanSave],
  )
  const onPressVerify = React.useCallback(async () => {
    if (canSave) {
      onPressSave()
    }
    try {
      setIsVerifying(true)
      setError('')
      const res = await store.agent.com.atproto.identity.resolveHandle({
        handle,
      })
      if (res.data.did === store.me.did) {
        setCanSave(true)
      } else {
        setError(`Incorrect DID returned (got ${res.data.did})`)
      }
    } catch (err: any) {
      setError(cleanError(err))
      store.log.error('Failed to verify domain', {handle, err})
    } finally {
      setIsVerifying(false)
    }
  }, [
    handle,
    store.me.did,
    setIsVerifying,
    setCanSave,
    setError,
    canSave,
    onPressSave,
    store.log,
    store.agent,
  ])

  // rendering
  // =
  return (
    <>
      <Text type="md" style={[pal.text, s.pb5, s.pl5]} nativeID="customDomain">
        Enter the domain you want to use
      </Text>
      <View style={[pal.btn, styles.textInputWrapper]}>
        <FontAwesomeIcon
          icon="at"
          style={[pal.textLight, styles.textInputIcon]}
        />
        <TextInput
          testID="setHandleInput"
          style={[pal.text, styles.textInput]}
          placeholder="e.g. alice.com"
          placeholderTextColor={pal.colors.textLight}
          autoCapitalize="none"
          keyboardAppearance={theme.colorScheme}
          value={handle}
          onChangeText={onChangeHandle}
          editable={!isProcessing}
          accessibilityLabelledBy="customDomain"
          accessibilityLabel="Custom domain"
          accessibilityHint="Input your preferred hosting provider"
        />
      </View>
      <View style={styles.spacer} />

      <View style={[styles.selectableBtns]}>
        <SelectableBtn
          selected={isDNSForm}
          label="DNS Panel"
          left
          onSelect={() => setDNSForm(true)}
          accessibilityHint="Use the DNS panel"
          style={s.flex1}
        />
        <SelectableBtn
          selected={!isDNSForm}
          label="No DNS Panel"
          right
          onSelect={() => setDNSForm(false)}
          accessibilityHint="Use a file on your server"
          style={s.flex1}
        />
      </View>
      <View style={styles.spacer} />
      {isDNSForm ? (
        <>
          <Text type="md" style={[pal.text, s.pb5, s.pl5]}>
            Add the following record to your domain:
          </Text>
          <View style={[styles.dnsTable, pal.btn]}>
            <Text type="md-medium" style={[styles.dnsLabel, pal.text]}>
              Domain:
            </Text>
            <View style={[styles.dnsValue]}>
              <Text type="mono" style={[styles.monoText, pal.text]}>
                _atproto.
              </Text>
            </View>
            <Text type="md-medium" style={[styles.dnsLabel, pal.text]}>
              Type:
            </Text>
            <View style={[styles.dnsValue]}>
              <Text type="mono" style={[styles.monoText, pal.text]}>
                TXT
              </Text>
            </View>
            <Text type="md-medium" style={[styles.dnsLabel, pal.text]}>
              Value:
            </Text>
            <View style={[styles.dnsValue]}>
              <Text type="mono" style={[styles.monoText, pal.text]}>
                did={store.me.did}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <Text type="md" style={[pal.text, s.pb5, s.pl5]}>
            Upload a text file to:
          </Text>
          <View style={[styles.valueContainer, pal.btn]}>
            <View style={[styles.dnsValue]}>
              <Text type="mono" style={[styles.monoText, pal.text]}>
                https://{handle}/.well-known/atproto-did
              </Text>
            </View>
          </View>
          <View style={styles.spacer} />
          <Text type="md" style={[pal.text, s.pb5, s.pl5]}>
            That contains the following:
          </Text>
          <View style={[styles.valueContainer, pal.btn]}>
            <View style={[styles.dnsValue]}>
              <Text type="mono" style={[styles.monoText, pal.text]}>
                {store.me.did}
              </Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.spacer} />
      <Button type="default" style={[s.p20, s.mb10]} onPress={onPressCopy}>
        <Text type="xl" style={[pal.link, s.textCenter]}>
          Copy {isDNSForm ? 'Domain Value' : 'File Contents'}
        </Text>
      </Button>
      {canSave === true && (
        <View style={[styles.message, palSecondary.view]}>
          <Text type="md-medium" style={palSecondary.text}>
            Domain verified!
          </Text>
        </View>
      )}
      {error && (
        <View style={[styles.message, palError.view]}>
          <Text type="md-medium" style={palError.text}>
            {error}
          </Text>
        </View>
      )}
      <Button
        type="primary"
        style={[s.p20, isVerifying && styles.dimmed]}
        onPress={onPressVerify}>
        {isVerifying ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text type="xl-medium" style={[s.white, s.textCenter]}>
            {canSave ? `Update to ${handle}` : 'Verify DNS Record'}
          </Text>
        )}
      </Button>
      <View style={styles.spacer} />
      <TouchableOpacity
        onPress={onToggleCustom}
        accessibilityLabel="Use default provider"
        accessibilityHint="Use bsky.social as hosting provider">
        <Text type="md-medium" style={[pal.link, s.pl10, s.pt5]}>
          Nevermind, create a handle for me
        </Text>
      </TouchableOpacity>
    </>
  )
}

const styles = StyleSheet.create({
  inner: {
    padding: 14,
  },
  footer: {
    padding: 14,
  },
  spacer: {
    height: 20,
  },
  dimmed: {
    opacity: 0.7,
  },

  selectableBtns: {
    flexDirection: 'row',
  },

  title: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  titleLeft: {
    width: 80,
  },
  titleRight: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  titleMiddle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 21,
  },

  textInputWrapper: {
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInputIcon: {
    marginLeft: 12,
  },
  textInput: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 17,
    letterSpacing: 0.25,
    fontWeight: '400',
    borderRadius: 10,
  },

  valueContainer: {
    borderRadius: 4,
    paddingVertical: 16,
  },

  dnsTable: {
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 16,
  },
  dnsLabel: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  dnsValue: {
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  monoText: {
    fontSize: 18,
    lineHeight: 20,
  },

  message: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 10,
    marginBottom: 10,
  },
  errorContainer: {marginBottom: 10},
})
