import { Component, type ReactNode } from 'react';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { failed: boolean };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="wrap stack">
        <div className="panel pad stack-sm">
          <h1 className="h2">Something went wrong on this page</h1>
          <p className="muted">Your saved answers are safe. Reload the page to continue; if it happens again, go back to the question bank.</p>
          <div className="row-actions">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
            <a className="btn" href="#bank">
              Go to the question bank
            </a>
          </div>
        </div>
      </main>
    );
  }
}
