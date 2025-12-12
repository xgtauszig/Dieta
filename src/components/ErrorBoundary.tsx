import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = async () => {
    // Clear Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    // Clear Cache Storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    // Reload
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-gray-50 text-gray-800">
          <h1 className="text-2xl font-bold mb-4">Ops, algo deu errado!</h1>
          <p className="mb-6 text-gray-600">
            O aplicativo encontrou um erro inesperado. Geralmente isso acontece após uma atualização.
          </p>
          <div className="p-4 bg-red-50 text-red-800 rounded-lg text-xs mb-6 max-w-xs overflow-auto">
             {this.state.error?.message}
          </div>
          <button
            onClick={this.handleReset}
            className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-green-700 transition-colors"
          >
            Corrigir / Recarregar App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
