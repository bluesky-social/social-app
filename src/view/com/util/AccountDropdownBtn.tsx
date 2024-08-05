import React from 'react'
import {Pressable} from 'react-native'

import {SessionAccount} from '#/state/session'
import {s} from 'lib/styles'

// @TODO Fabric
export function AccountDropdownBtn({
  account: _account,
}: {
  account: SessionAccount
}) {
  // const pal = usePalette('default')
  // const {removeAccount} = useSessionApi()
  // const {_} = useLingui()

  // const items: DropdownItem[] = [
  //   {
  //     label: _(msg`Remove account`),
  //     onPress: () => {
  //       removeAccount(account)
  //       Toast.show(_(msg`Account removed from quick access`))
  //     },
  //     icon: {
  //       ios: {
  //         name: 'trash',
  //       },
  //       android: 'ic_delete',
  //       web: ['far', 'trash-can'],
  //     },
  //   },
  // ]
  return (
    <Pressable accessibilityRole="button" style={s.pl10}>
      {/*<NativeDropdown*/}
      {/*  testID="accountSettingsDropdownBtn"*/}
      {/*  items={items}*/}
      {/*  accessibilityLabel={_(msg`Account options`)}*/}
      {/*  accessibilityHint="">*/}
      {/*  <FontAwesomeIcon*/}
      {/*    icon="ellipsis-h"*/}
      {/*    style={pal.textLight as FontAwesomeIconStyle}*/}
      {/*  />*/}
      {/*</NativeDropdown>*/}
    </Pressable>
  )
}
