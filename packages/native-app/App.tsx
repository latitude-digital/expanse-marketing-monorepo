/**
 * Main App component for Expanse Native Survey App
 * Entry point for the React Native application
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Import shared types to verify import resolution
import type { ExpanseEvent, Brand } from '@expanse/shared/types';

export default function App() {
  const [testBrand] = React.useState<Brand>('Ford');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expanse Survey App</Text>
      <Text style={styles.subtitle}>Native Ford/Lincoln Survey Collection</Text>
      <Text style={styles.info}>Test Brand: {testBrand}</Text>
      <StatusBar style="auto" />
    </View>
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