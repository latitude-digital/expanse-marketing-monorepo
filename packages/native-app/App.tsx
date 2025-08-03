/**
 * Main App component for Expanse Native Survey App
 * Entry point for the React Native application
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';

// Import shared types to verify import resolution
import type { ExpanseEvent, Brand } from '@expanse/shared/types';

// Import WebView test component
import TestWebView from './src/components/TestWebView';

export default function App() {
  const [testBrand] = React.useState<Brand>('Ford');
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <TestWebView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#999',
  },
});