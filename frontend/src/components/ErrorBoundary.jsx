import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border-2 border-red-500 bg-red-50/20 text-red-700 rounded-3xl text-left font-mono my-4">
          <h3 className="text-lg font-bold mb-2">⚠️ Chat Component Crash</h3>
          <p className="font-bold text-sm">Message: {this.state.error?.message || String(this.state.error)}</p>
          <pre className="mt-4 p-4 bg-gray-100 rounded-xl text-xs overflow-x-auto max-h-60 whitespace-pre-wrap">
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => {
              sessionStorage.clear();
              this.setState({ hasError: false, error: null });
            }}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-sans font-bold text-xs"
          >
            Clear Cache & Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
