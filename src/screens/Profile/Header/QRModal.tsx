import React from 'react'
import {Modal, Pressable,View} from 'react-native'
// @ts-expect-error missing types
import QRCodeStyled from 'react-native-qrcode-styled'
import {AppBskyActorDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {ButtonText} from '#/components/Button'

interface QRCodeModalProps {
  profile_: AppBskyActorDefs.ProfileViewDetailed // Define the type of profile
  visible: boolean // Receive the visibility status as a prop
  setVisible: (visible: boolean) => void // Receive the function to set visibility as a prop
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  profile_,
  visible,
  setVisible,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setVisible(false)} // Close modal when back button is pressed (for Android)
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        }}>
        <View
          style={{
            justifyContent: 'center', // Center QR code horizontally
            alignItems: 'center', // Center QR code vertically
            backgroundColor: 'white', // Set the background color
            padding: 20, // Add padding to give space around QR code
            borderRadius: 10, // Optional: round the corners of the modal content
          }}>
          <QRCodeStyled
            data={`https://bsky.app/${makeProfileLink(profile_)}`}
            style={{width: 200, height: 200}} // Larger QR code
            padding={20}
            pieceSize={10} // Larger pieces for clearer QR code
          />
        </View>

        {/* Pressable to close the modal */}
        <Pressable
          accessibilityRole="button"
          onPress={() => setVisible(false)}
          style={{
            marginTop: 20,
            backgroundColor: 'transparent',
            padding: 10,
            borderRadius: 5,
            borderColor: 'white',
            borderWidth: 1,
          }}>
          <ButtonText>
            <Trans style={{color: 'white', fontSize: 16}}>Close</Trans>
          </ButtonText>
        </Pressable>
      </View>
    </Modal>
  )
}

export default QRCodeModal
