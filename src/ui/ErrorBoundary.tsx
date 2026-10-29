import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Catches render-time errors in the subtree below it (e.g. a layout crash from
// Dagre on pathological input) and shows a fallback instead of white-screening
// the whole app. Error boundaries must be class components — there is no hook
// equivalent.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface the error for debugging; the fallback UI handles the user side.
    console.error('Diagram render failed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="mb-1 font-semibold">Something went wrong rendering the diagram.</div>
            <p className="mb-3 font-mono text-xs text-red-600">{this.state.error.message}</p>
            <p className="mb-3 text-red-700">
              Your text is safe in the editor. Try editing it, or reload the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded border border-red-300 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
