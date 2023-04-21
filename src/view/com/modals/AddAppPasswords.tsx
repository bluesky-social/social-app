import React, {useState} from 'react'
import {StyleSheet, TextInput, View, TouchableOpacity} from 'react-native'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import Clipboard from '@react-native-clipboard/clipboard'
import * as Toast from '../util/Toast'

export const snapPoints = ['70%']

export function Component({}: {}) {
  const pal = usePalette('default')
  const store = useStores()
  const [name, setName] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [wasCopied, setWasCopied] = useState(false)

  const onCopy = React.useCallback(() => {
    Clipboard.setString(appPassword)
    Toast.show('Copied to clipboard')
    setWasCopied(true)
  }, [appPassword])

  const onDone = React.useCallback(() => {
    store.shell.closeModal()
  }, [store])

  const createAppPassword = async () => {
    const newPassword = await store.me.createAppPassword(name)
    if (newPassword) {
      setAppPassword(newPassword.password)
    } else {
      Toast.show('Failed to create app password.')
      // TODO: better error handling (?)
    }
  }

  return (
    <View style={[styles.container, pal.view]} testID="addAppPasswordsModal">
      <View>
        <Text type="lg">
          {!appPassword
            ? 'Please enter a unique name for this App Password:'
            : "Please save this secret key somewhere safe and accessible. For security reasons, you won't be able to view it again. If you lose this secret key, you'll need to generate a new one."}
        </Text>
        {!appPassword ? (
          <View style={[pal.btn, styles.textInputWrapper]}>
            <TextInput
              style={[styles.input, pal.text]}
              onChangeText={setName}
              value={name}
              placeholder="Enter a name for this App Password"
              placeholderTextColor={pal.colors.textLight}
              autoCorrect={false}
              autoComplete="off"
              autoCapitalize="none"
              autoFocus={true}
              editable={!appPassword}
              returnKeyType="done"
              onEndEditing={createAppPassword}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={[pal.border, styles.passwordContainer, pal.btn]}
            onPress={onCopy}>
            <Text type="2xl-bold">{appPassword}</Text>
            {wasCopied ? (
              <Text style={[pal.textLight]}>Copied</Text>
            ) : (
              <FontAwesomeIcon
                icon={['far', 'clone']}
                style={pal.text as FontAwesomeIconStyle}
                size={18}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.btnContainer}>
        <Button
          type="primary"
          label={!appPassword ? 'Create App Password' : 'Done'}
          style={styles.btn}
          labelStyle={styles.btnLabel}
          onPress={!appPassword ? createAppPassword : onDone}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 50,
    marginHorizontal: 16,
  },
  textInputWrapper: {
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 17,
    letterSpacing: 0.25,
    fontWeight: '400',
    borderRadius: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    paddingHorizontal: 60,
    paddingVertical: 14,
  },
  btnLabel: {
    fontSize: 18,
  },
  groupContent: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
})
