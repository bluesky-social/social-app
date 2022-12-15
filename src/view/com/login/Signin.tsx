import React, {useState, useEffect} from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Logo} from './Logo'
import {s, colors} from '../../lib/styles'
import {createFullHandle, toNiceDomain} from '../../../lib/strings'
import {useStores, DEFAULT_SERVICE} from '../../../state'
import {ServiceDescription} from '../../../state/models/session'
import {ServerInputModal} from '../../../state/models/shell-ui'
import {isNetworkError} from '../../../lib/errors'

export const Signin = ({onPressBack}: {onPressBack: () => void}) => {
  const store = useStores()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [serviceUrl, setServiceUrl] = useState<string>(DEFAULT_SERVICE)
  const [serviceDescription, setServiceDescription] = useState<
    ServiceDescription | undefined
  >(undefined)
  const [error, setError] = useState<string>('')
  const [handle, setHandle] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  useEffect(() => {
    let aborted = false
    setError('')
    console.log('Fetching service description', serviceUrl)
    store.session.describeService(serviceUrl).then(
      desc => {
        if (aborted) return
        setServiceDescription(desc)
      },
      err => {
        if (aborted) return
        console.error(err)
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      },
    )
    return () => {
      aborted = true
    }
  }, [store.session, serviceUrl])

  const onPressSelectService = () => {
    store.shell.openModal(new ServerInputModal(serviceUrl, setServiceUrl))
  }

  const onPressNext = async () => {
    setError('')
    setIsProcessing(true)

    // try to guess the handle if the user just gave their own username
    try {
      let fullHandle = handle
      if (
        serviceDescription &&
        serviceDescription.availableUserDomains.length > 0
      ) {
        let matched = false
        for (const domain of serviceDescription.availableUserDomains) {
          if (fullHandle.endsWith(domain)) {
            matched = true
          }
        }
        if (!matched) {
          fullHandle = createFullHandle(
            handle,
            serviceDescription.availableUserDomains[0],
          )
        }
      }

      await store.session.login({
        service: serviceUrl,
        handle: fullHandle,
        password,
      })
    } catch (e: any) {
      const errMsg = e.toString()
      console.log(e)
      setIsProcessing(false)
      if (errMsg.includes('Authentication Required')) {
        setError('Invalid username or password')
      } else if (isNetworkError(e)) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      } else {
        setError(errMsg.replace(/^Error:/, ''))
      }
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <View style={styles.logoHero}>
        <Logo />
      </View>
      <View style={styles.group}>
        <TouchableOpacity
          style={[styles.groupTitle, {paddingRight: 0, paddingVertical: 6}]}
          onPress={onPressSelectService}>
          <Text style={[s.flex1, s.white, s.f18, s.bold]} numberOfLines={1}>
            Sign in to {toNiceDomain(serviceUrl)}
          </Text>
          <View style={styles.textBtnFakeInnerBtn}>
            <FontAwesomeIcon
              icon="pen"
              size={12}
              style={styles.textBtnFakeInnerBtnIcon}
            />
            <Text style={styles.textBtnFakeInnerBtnLabel}>Change</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.groupContent}>
          <FontAwesomeIcon icon="at" style={styles.groupContentIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Username"
            placeholderTextColor={colors.blue0}
            autoCapitalize="none"
            autoFocus
            autoCorrect={false}
            value={handle}
            onChangeText={str => setHandle((str || '').toLowerCase())}
            editable={!isProcessing}
          />
        </View>
        <View style={styles.groupContent}>
          <FontAwesomeIcon icon="lock" style={styles.groupContentIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Password"
            placeholderTextColor={colors.blue0}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isProcessing}
          />
        </View>
      </View>
      {error ? (
        <View style={styles.error}>
          <View style={styles.errorIcon}>
            <FontAwesomeIcon icon="exclamation" style={s.white} size={10} />
          </View>
          <View style={s.flex1}>
            <Text style={[s.white, s.bold]}>{error}</Text>
          </View>
        </View>
      ) : undefined}
      <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
        <TouchableOpacity onPress={onPressBack}>
          <Text style={[s.white, s.f18, s.pl5]}>Back</Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        <TouchableOpacity onPress={onPressNext}>
          {!serviceDescription || isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[s.white, s.f18, s.bold, s.pr5]}>Next</Text>
          )}
        </TouchableOpacity>
        {!serviceDescription || isProcessing ? (
          <Text style={[s.white, s.f18, s.pl10]}>Connecting...</Text>
        ) : undefined}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  logoHero: {
    paddingTop: 30,
    paddingBottom: 40,
  },
  group: {
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: colors.blue3,
  },
  groupTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  groupContent: {
    borderTopWidth: 1,
    borderTopColor: colors.blue1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupContentIcon: {
    color: 'white',
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.blue3,
    color: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 18,
    borderRadius: 10,
  },
  textBtnFakeInnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue2,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 6,
  },
  textBtnFakeInnerBtnIcon: {
    color: colors.white,
    marginRight: 4,
  },
  textBtnFakeInnerBtnLabel: {
    color: colors.white,
  },
  error: {
    borderWidth: 1,
    borderColor: colors.red5,
    backgroundColor: colors.red4,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  errorIcon: {
    borderWidth: 1,
    borderColor: colors.white,
    color: colors.white,
    borderRadius: 30,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
})
