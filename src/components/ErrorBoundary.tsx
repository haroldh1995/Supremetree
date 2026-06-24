import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {}

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Dumare tree failure', error, info)
  }

  override render() {
    if (this.state.error) {
      return (
        <main className="fatalError" role="alert">
          <h1>Dumare tree could not start</h1>
          <p>{this.state.error.message}</p>
          <button type="button" onClick={() => location.reload()}>
            Reload
          </button>
        </main>
      )
    }

    return this.props.children
  }
}
