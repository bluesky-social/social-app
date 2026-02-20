import {Component, type ErrorInfo, type ReactNode} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {reloadAppAsync} from 'expo'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {ErrorScreen} from '#/components/ErrorScreen'
import {IS_WEB} from '#/env'

interface Props {
  children?: ReactNode
  renderError?: (error: any) => ReactNode
  style?: StyleProp<ViewStyle>
}

interface State {
  hasError: boolean
  error: any
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  }

  public static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error}
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(error, {errorInfo})
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.renderError) {
        return this.props.renderError(this.state.error)
      }

      return (
        <View style={[{height: '100%', flex: 1}, this.props.style]}>
          <TranslatedErrorScreen details={cleanError(this.state.error)} />
        </View>
      )
    }

    return this.props.children
  }
}

function TranslatedErrorScreen({details}: {details?: string}) {
  const {_} = useLingui()

  return (
    <ErrorScreen
      title={_(msg`Oh no!`)}
      message={_(
        msg`There was an unexpected issue in the application. Please let us know if this happened to you!`,
      )}
      details={details}
      onPressTryAgain={() => {
        if (IS_WEB) {
          window.location.reload()
        } else {
          void reloadAppAsync()
        }
      }}
    />
  )
}
