import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {isNative} from '#/platform/detection'
import {useAgent, useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Loader} from '#/components/Loader'
import {P, Text} from '#/components/Typography'
import {Secp256k1Keypair} from '@atproto/crypto'
import base64 from 'base64-js'

enum Stages {
  Email,
  ConfirmCode,
  BackupComplete,
}

export function KeyBackupDialog({
  control,
  onBackupComplete,
}: {
  control: Dialog.DialogOuterProps['control']
  onBackupComplete?: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()
  const agent = useAgent()

  const [stage, setStage] = useState<Stages>(Stages.Email)
  const [confirmationCode, setConfirmationCode] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const [backupKey, setBackupKey] = useState<Secp256k1Keypair | null>(null)
  const [privateKey, setPrivateKey] = useState<string>('')
  const [did, setDid] = useState<string>('')

  useEffect(() => {
    if (backupKey) {
      ;(async () => {
        let privateKey: Uint8Array = await backupKey.export()
        let privateKeyBase64 = isNative
          ? Buffer.from(privateKey).toString('base64')
          : base64.fromByteArray(privateKey)
        setPrivateKey(privateKeyBase64)
        setDid(backupKey.did())
      })()
    }
  }, [backupKey])

  const onSendEmail = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await agent.com.atproto.identity.requestPlcOperationSignature()
      setStage(Stages.ConfirmCode)
    } catch (e) {
      setError(cleanError(String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  const onConfirmBackup = async () => {
    setError('')
    setIsProcessing(true)
    try {
      if (confirmationCode.trim() === '') {
        setError(_(msg`Invalid confirmation code.`))
        return
      }

      // Create and add the rotation key
      const generatedKey = await Secp256k1Keypair.create({exportable: true})
      let success = await addRotationKey(generatedKey.did(), {
        token: confirmationCode,
        insertFirst: true,
      })

      if (!success) {
        setError(_(msg`Failed to add rotation key.`))
        return
      }

      setBackupKey(generatedKey)
      setStage(Stages.BackupComplete)

      Toast.show(
        _(msg({message: 'Backup key created successfully', context: 'toast'})),
      )
      if (onBackupComplete) {
        onBackupComplete()
      }
    } catch (e) {
      const errMsg = String(e)
      if (errMsg.includes('Token is invalid')) {
        setError(_(msg`Invalid confirmation code. ${errMsg}`))
      } else {
        setError(cleanError(errMsg))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const addRotationKey = async (newKeyStr: string, options: any) => {
    const {
      insertFirst = false,
      plcHost = 'https://plc.directory',
      token = undefined,
    } = options

    if (!newKeyStr || !newKeyStr.startsWith('did:key:')) {
      throw new Error('Need to provide valid public key argument (as did:key)')
    }

    const userDid = agent.assertDid

    // 1. Fetch current PLC data
    const plcDataUrl = `${plcHost}/${userDid}/data`
    const response = await fetch(plcDataUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch PLC data: ${response.statusText}`)
    }

    const plcData = await response.json()

    // Check if we already have 5 rotation keys (the maximum)
    if (plcData.rotationKeys && plcData.rotationKeys.length >= 5) {
      console.warn(
        'WARNING: already have 5 rotation keys, which is the maximum',
      )
      setError(
        _(msg`You already have the maximum number of rotation keys (5).`),
      )
    }

    // Check if key already exists in rotation keys
    if (plcData.rotationKeys && plcData.rotationKeys.includes(newKeyStr)) {
      throw new Error('Key already registered as a rotation key')
    }

    // add the new key
    if (insertFirst && plcData.rotationKeys) {
      plcData.rotationKeys.unshift(newKeyStr)
    } else {
      plcData.rotationKeys = plcData.rotationKeys || []
      plcData.rotationKeys.push(newKeyStr)
    }

    const operationInput = {...plcData}
    if (token) {
      operationInput.token = token
    }

    // sign the operation
    const signedOp = await agent.com.atproto.identity.signPlcOperation({
      rotationKeys: plcData.rotationKeys,
      token: token,
    })

    await agent.com.atproto.identity.submitPlcOperation({
      operation: signedOp.data.operation,
    })

    return true
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        accessibilityDescribedBy="dialog-description"
        accessibilityLabelledBy="dialog-title">
        <View style={[a.relative, a.gap_md, a.w_full]}>
          <Text
            nativeID="dialog-title"
            style={[a.text_2xl, a.font_bold, t.atoms.text]}>
            <Trans>Backup Recovery Key</Trans>
          </Text>
          <P nativeID="dialog-description">
            {stage === Stages.ConfirmCode ? (
              <Trans>
                An email has been sent to{' '}
                {currentAccount?.email || '(no email)'}. It includes a
                confirmation code which you can enter below to verify your
                identity.
              </Trans>
            ) : stage === Stages.BackupComplete ? (
              <Trans>
                Your backup key has been created successfully. Please save this
                key in a secure location. You will need it to recover your
                account if you lose access.
              </Trans>
            ) : (
              <Trans>
                To create a backup recovery key, we need to verify your identity
                through your email address.
              </Trans>
            )}
          </P>

          {error ? <ErrorMessage message={error} /> : undefined}

          {stage === Stages.Email ? (
            <View
              style={[
                a.gap_sm,
                gtMobile && [a.flex_row, a.justify_end, a.gap_md],
              ]}>
              <Button
                testID="sendEmailButton"
                variant="solid"
                color="primary"
                size={gtMobile ? 'small' : 'large'}
                onPress={onSendEmail}
                label={_(msg`Send verification email`)}
                disabled={isProcessing}>
                <ButtonText>
                  <Trans>Send verification email</Trans>
                </ButtonText>
                {isProcessing && <ButtonIcon icon={Loader} />}
              </Button>
              <Button
                testID="haveCodeButton"
                variant="ghost"
                color="primary"
                size={gtMobile ? 'small' : 'large'}
                onPress={() => setStage(Stages.ConfirmCode)}
                label={_(msg`I have a code`)}
                disabled={isProcessing}>
                <ButtonText>
                  <Trans>I have a code</Trans>
                </ButtonText>
              </Button>
            </View>
          ) : stage === Stages.ConfirmCode ? (
            <View>
              <View style={[a.mb_md]}>
                <TextField.LabelText>
                  <Trans>Confirmation code</Trans>
                </TextField.LabelText>
                <TextField.Root>
                  <TextField.Icon icon={Lock} />
                  <Dialog.Input
                    testID="confirmationCode"
                    label={_(msg`Confirmation code`)}
                    autoCapitalize="none"
                    autoFocus
                    autoCorrect={false}
                    autoComplete="off"
                    value={confirmationCode}
                    onChangeText={setConfirmationCode}
                    onSubmitEditing={onConfirmBackup}
                    editable={!isProcessing}
                  />
                </TextField.Root>
              </View>
              <View
                style={[
                  a.gap_sm,
                  gtMobile && [a.flex_row, a.justify_end, a.gap_md],
                ]}>
                <Button
                  testID="resendCodeBtn"
                  variant="ghost"
                  color="primary"
                  size={gtMobile ? 'small' : 'large'}
                  onPress={onSendEmail}
                  label={_(msg`Resend email`)}
                  disabled={isProcessing}>
                  <ButtonText>
                    <Trans>Resend email</Trans>
                  </ButtonText>
                </Button>
                <Button
                  testID="confirmBtn"
                  variant="solid"
                  color="primary"
                  size={gtMobile ? 'small' : 'large'}
                  onPress={onConfirmBackup}
                  label={_(msg`Create backup key`)}
                  disabled={isProcessing}>
                  <ButtonText>
                    <Trans>Create backup key</Trans>
                  </ButtonText>
                  {isProcessing && <ButtonIcon icon={Loader} />}
                </Button>
              </View>
            </View>
          ) : stage === Stages.BackupComplete ? (
            <View>
              <View
                style={[a.mb_md, a.p_md, a.rounded_md, t.atoms.bg_contrast_25]}>
                <TextField.LabelText>
                  <Trans>
                    Your backup key! Store safely in a secure location.
                  </Trans>
                </TextField.LabelText>
                <View style={[a.flex_col, a.gap_sm]}>
                  <Text>{did}</Text>
                  <Text>{privateKey}</Text>
                </View>
              </View>
              <View
                style={[
                  a.gap_sm,
                  gtMobile && [a.flex_row, a.justify_end, a.gap_md],
                ]}>
                <Button
                  testID="closeBtn"
                  variant="solid"
                  color="primary"
                  size={gtMobile ? 'small' : 'large'}
                  onPress={() => {
                    setStage(Stages.Email)
                    control.close()
                  }}
                  label={_(msg`Close`)}>
                  <ButtonText>
                    <Trans>Close</Trans>
                  </ButtonText>
                </Button>
              </View>
            </View>
          ) : undefined}

          {!gtMobile && isNative && <View style={{height: 40}} />}
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
