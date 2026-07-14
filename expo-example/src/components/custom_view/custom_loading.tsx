import { ActivityIndicator, StyleSheet, View } from 'react-native';
import React from 'react';

export const CustomLoading = () => {
  return (
    <View style={styles.background}>
      <ActivityIndicator />
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#rgba(0,0,0,0)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
