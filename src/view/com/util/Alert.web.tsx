import {AlertButton, AlertStatic} from 'react-native'

class WebAlert implements Pick<AlertStatic, 'alert'> {
  public alert(title: string, message?: string, buttons?: AlertButton[]): void {
    if (buttons === undefined || buttons.length === 0) {
      // eslint-disable-next-line no-alert
      window.alert([title, message].filter(Boolean).join('\n'))
      return
    }

    // eslint-disable-next-line no-alert
    const result = window.confirm([title, message].filter(Boolean).join('\n'))

    if (result === true) {
      const confirm = buttons.find(({style}) => style !== 'cancel')
      confirm?.onPress?.()
      return
    }

    const cancel = buttons.find(({style}) => style === 'cancel')
    cancel?.onPress?.()
  }
}

export const Alert = new WebAlert()
