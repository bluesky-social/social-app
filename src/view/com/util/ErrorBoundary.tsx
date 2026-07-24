import {Component, type ErrorInfo, type ReactNode} from 'react'
import {type StyleProp, type ViewStyle} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {ErrorScreen} from './error/ErrorScreen'
import {CenteredView} from './Views'

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
        <CenteredView style={[{height: '100%', flex: 1}, this.props.style]}>
          <TranslatedErrorScreen details={this.state.error.toString()} />
        </CenteredView>
      )
    }

    return this.props.children
  }
}

function TranslatedErrorScreen({details}: {details?: string}) {
  const {t: l} = useLingui()

  return (
    <ErrorScreen
      title={l`Oh no!`}
      message={l`There was an unexpected issue in the application. Please let us know if this happened to you!`}
      details={details}
    />
  )
}
