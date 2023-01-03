import React, {Component, ErrorInfo, ReactNode} from 'react'
import {ErrorScreen} from './error/ErrorScreen'

interface Props {
  children?: ReactNode
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
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          title="Oh no!"
          message="There was an unexpected issue in the application. Please let us know if this happened to you!"
          details={this.state.error.toString()}
        />
      )
    }

    return this.props.children
  }
}
