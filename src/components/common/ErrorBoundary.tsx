import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class-based error boundary that wraps a subtree and shows a recovery UI
 * if an uncaught render-time error is thrown within it.
 *
 * Must be a class component — React does not support error boundaries as
 * function components.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[WorkoutBro] Uncaught error caught by boundary:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="wb-screen" style={{ paddingTop: 'var(--wb-space-12)' }}>
          <div
            className="wb-card wb-card-elevated"
            style={{
              textAlign: 'center',
              padding: 'var(--wb-space-8) var(--wb-space-6)',
            }}
          >
            <h2
              style={{
                margin: '0 0 var(--wb-space-2)',
                fontSize: 'var(--wb-font-xl)',
                letterSpacing: '-0.02em',
              }}
            >
              Something went wrong
            </h2>
            {this.state.error && (
              <p
                className="wb-muted"
                style={{
                  margin: '0 0 var(--wb-space-6)',
                  fontSize: 'var(--wb-font-sm)',
                }}
              >
                {this.state.error.message}
              </p>
            )}
            <button
              className="wb-chip-button"
              style={{ display: 'inline-flex', margin: '0 auto' }}
              onClick={() => window.location.reload()}
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
