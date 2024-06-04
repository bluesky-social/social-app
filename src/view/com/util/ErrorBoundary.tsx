import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {ErrorScreen} from './error/ErrorScreen'
import {CenteredView} from './Views'

interface Props {
  children?: React.ReactNode
  renderError?: (error: any) => React.ReactNode
}

interface State {
  hasError: boolean
  error: any
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  }

  public static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error}
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(error, {errorInfo})
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.renderError) {
        return this.props.renderError(this.state.error)
      }

      return (
        <CenteredView style={{height: '100%', flex: 1}}>
          <TranslatedErrorScreen details={this.state.error.toString()} />
        </CenteredView>
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
    />
  )
}
