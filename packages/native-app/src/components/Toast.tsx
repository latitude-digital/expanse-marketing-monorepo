import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ToastProps {
  message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => (
  <View style={styles.container} pointerEvents="none">
    <View style={styles.content}>
      <Text style={styles.text}>{message}</Text>
    </View>
  </View>
);

export default Toast;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    maxWidth: '90%',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
