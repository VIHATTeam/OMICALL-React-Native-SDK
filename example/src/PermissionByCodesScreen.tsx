import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { requestPermissionsByCodes } from 'omikit-plugin';

const PermissionByCodesScreen = () => {
  const [loading, setLoading] = useState(false);

  const requestSpecificPermissions = async (codes: number[], description: string) => {
    if (Platform.OS !== 'android') {
      Alert.alert('Info', 'Permission management is only available on Android');
      return;
    }

    setLoading(true);
    try {
      console.log(`🔐 Requesting permissions for codes: ${codes.join(', ')}`);
      const result = await requestPermissionsByCodes(codes);
      
      if (result) {
        Alert.alert(
          'Success', 
          `${description} permissions granted successfully!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Permission Denied', 
          `${description} permissions were not granted. Please enable them in device settings.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Permission request error:', error);
      Alert.alert(
        'Error', 
        `Failed to request ${description} permissions: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Permission Request by Codes</Text>
      <Text style={styles.subtitle}>Test permission codes 450, 451, 452</Text>

      <TouchableOpacity
        style={[styles.button, styles.recordAudioButton]}
        onPress={() => requestSpecificPermissions([450], 'Record Audio')}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          Request Code 450 - Record Audio
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.foregroundServiceButton]}
        onPress={() => requestSpecificPermissions([451], 'Foreground Service')}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          Request Code 451 - Foreground Service
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.notificationButton]}
        onPress={() => requestSpecificPermissions([452], 'Post Notifications')}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          Request Code 452 - Post Notifications
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.allButton]}
        onPress={() => requestSpecificPermissions([450, 451, 452], 'All Required')}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          Request All Codes (450, 451, 452)
        </Text>
      </TouchableOpacity>

      {loading && (
        <Text style={styles.loadingText}>Processing permission request...</Text>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Permission Codes:</Text>
        <Text style={styles.infoText}>• 450: RECORD_AUDIO (Android 14+)</Text>
        <Text style={styles.infoText}>• 451: FOREGROUND_SERVICE (Android 14+)</Text>
        <Text style={styles.infoText}>• 452: POST_NOTIFICATIONS (Android 13+)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  recordAudioButton: {
    backgroundColor: '#FF6B6B',
  },
  foregroundServiceButton: {
    backgroundColor: '#4ECDC4',
  },
  notificationButton: {
    backgroundColor: '#45B7D1',
  },
  allButton: {
    backgroundColor: '#96CEB4',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  infoContainer: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});

export default PermissionByCodesScreen;