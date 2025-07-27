import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>An unexpected error occurred. This might be due to a temporary network issue.</p>
            
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="retry-button"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
            }

            .error-container {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border-radius: 24px;
              padding: 48px;
              max-width: 500px;
              width: 100%;
              text-align: center;
              box-shadow: 0 32px 64px rgba(0, 0, 0, 0.15);
            }

            .error-icon {
              font-size: 64px;
              margin-bottom: 24px;
            }

            .error-container h2 {
              margin: 0 0 16px 0;
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
            }

            .error-container p {
              margin: 0 0 32px 0;
              color: #6b7280;
              font-size: 16px;
              line-height: 1.6;
            }

            .error-actions {
              display: flex;
              gap: 16px;
              justify-content: center;
              margin-bottom: 24px;
            }

            .retry-button, .reload-button {
              padding: 12px 24px;
              border: none;
              border-radius: 12px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            }

            .retry-button {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }

            .retry-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
            }

            .reload-button {
              background: #f3f4f6;
              color: #374151;
              border: 1px solid #d1d5db;
            }

            .reload-button:hover {
              background: #e5e7eb;
            }

            .error-details {
              text-align: left;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              margin-top: 24px;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              color: #374151;
              margin-bottom: 12px;
            }

            .error-details pre {
              background: #1f2937;
              color: #f3f4f6;
              padding: 12px;
              border-radius: 6px;
              font-size: 12px;
              overflow-x: auto;
              margin: 8px 0;
            }

            @media (max-width: 768px) {
              .error-container {
                padding: 32px 24px;
                margin: 16px;
              }

              .error-actions {
                flex-direction: column;
              }

              .retry-button, .reload-button {
                width: 100%;
              }
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
