import * as Updates from 'expo-updates'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQuery} from '@tanstack/react-query'

import * as Toast from '#/view/com/util/Toast'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon} from '#/components/icons/ArrowRotateCounterClockwise'
import {Shapes_Stroke2_Corner0_Rounded as ShapesIcon} from '#/components/icons/Shapes'
import {Loader} from '#/components/Loader'
import * as SettingsList from '../components/SettingsList'

export function OTAInfo() {
  const {_} = useLingui()
  const {
    data: isAvailable,
    isPending: isPendingInfo,
    isFetching: isFetchingInfo,
    isError: isErrorInfo,
    refetch,
  } = useQuery({
    queryKey: ['ota-info'],
    queryFn: async () => {
      const status = await Updates.checkForUpdateAsync()
      return status.isAvailable
    },
  })

  const {mutate: fetchAndLaunchUpdate, isPending: isPendingUpdate} =
    useMutation({
      mutationFn: async () => {
        await Updates.fetchUpdateAsync()
        await Updates.reloadAsync()
      },
      onError: error =>
        Toast.show(`Failed to update: ${error.message}`, 'xmark'),
    })

  if (!Updates.isEnabled || __DEV__) {
    return null
  }

  return (
    <SettingsList.Item>
      <SettingsList.ItemIcon icon={ShapesIcon} />
      <SettingsList.ItemText>
        {isAvailable ? (
          <Trans>OTA status: Available!</Trans>
        ) : isErrorInfo ? (
          <Trans>OTA status: Error fetching update</Trans>
        ) : isPendingInfo ? (
          <Trans>OTA status: ...</Trans>
        ) : (
          <Trans>OTA status: None available</Trans>
        )}
      </SettingsList.ItemText>
      <Button
        label={isAvailable ? _(msg`Update`) : _(msg`Fetch update`)}
        disabled={isFetchingInfo || isPendingUpdate}
        variant="solid"
        size="small"
        color={isAvailable ? 'primary' : 'secondary_inverted'}
        onPress={() => {
          if (isFetchingInfo || isPendingUpdate) return

          if (isAvailable) {
            fetchAndLaunchUpdate()
          } else {
            refetch()
          }
        }}>
        {isAvailable ? (
          <ButtonText>
            <Trans>Update</Trans>
          </ButtonText>
        ) : (
          <ButtonIcon icon={isFetchingInfo ? Loader : RetryIcon} />
        )}
      </Button>
    </SettingsList.Item>
  )
}
