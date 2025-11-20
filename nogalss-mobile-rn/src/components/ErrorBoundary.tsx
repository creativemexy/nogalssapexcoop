import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error info:', errorInfo);
    
    // Log full error details for debugging
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    
    // Ignore update-related errors - they're not critical
    if (error.message?.includes('remote update') || 
        error.message?.includes('IOException') ||
        error.message?.includes('Failed to download')) {
      // Silently ignore update errors and continue
      this.setState({ hasError: false, error: null });
      return;
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Ignore update errors - they're not critical for development
      if (this.state.error.message?.includes('remote update') || 
          this.state.error.message?.includes('IOException') ||
          this.state.error.message?.includes('Failed to download')) {
        // Render children anyway - update errors shouldn't block the app
        return this.props.children;
      }

      // Show error UI for other errors
      const errorMessage = this.state.error.message || 'Unknown error';
      const errorStack = this.state.error.stack || '';
      
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{errorMessage}</Text>
          {errorStack && (
            <ScrollView style={styles.stackContainer}>
              <Text style={styles.stackTitle}>Error Details:</Text>
              <Text style={styles.stackTrace}>
                {errorStack.split('\n').slice(0, 10).join('\n')}
              </Text>
            </ScrollView>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Check the terminal for full error details
          </Text>
          <Text style={styles.hint}>
            Error: {errorMessage}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stackContainer: {
    maxHeight: 200,
    marginTop: 12,
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  stackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
});

