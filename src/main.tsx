import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[WorshipFlow] Runtime error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '80px auto', padding: 32, color: '#0f172a' }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>WorshipFlow hit a problem</h1>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
            Something went wrong while loading the app. Try refreshing the page. If it keeps happening, open the project in Bolt and republish.
          </p>
          <pre style={{ marginTop: 16, fontSize: 12, color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
