import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';

import { checkPermissionStatus, checkAndRequestPermissions, requestSystemAlertWindowPermission } from 'omikit-plugin';

interface PermissionStatus {
  essentialGranted: string[];
  essentialMissing: string[];
  canMakeVoipCalls: boolean;
  foregroundServicePermissions: Record<string, boolean>;
  canDrawOverlays: boolean;
  androidVersion: number;
  targetSdk: number;
}

const PermissionTestScreen: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setLoading(true);
      const status = await checkPermissionStatus();
      console.log('🔍 Permission Status:', status);
      setPermissionStatus(status);
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      Alert.alert('Error', 'Failed to check permissions');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async (isVideo: boolean = false) => {
    try {
      setLoading(true);
      console.log(`📋 Requesting permissions (video: ${isVideo})...`);
      
      const result = await checkAndRequestPermissions(isVideo);
      console.log('✅ Permission request result:', result);
      
      // Refresh permission status
      await checkPermissions();
      
      Alert.alert(
        'Permissions', 
        result ? 'Permissions granted successfully!' : 'Some permissions were denied'
      );
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    } finally {
      setLoading(false);
    }
  };

  const requestOverlayPermission = async () => {
    try {
      setLoading(true);
      const result = await requestSystemAlertWindowPermission();
      console.log('🪟 Overlay permission result:', result);
      
      // Refresh permission status
      await checkPermissions();
      
      Alert.alert(
        'Overlay Permission', 
        result ? 'Overlay permission granted!' : 'Overlay permission denied'
      );
    } catch (error) {
      console.error('❌ Error requesting overlay permission:', error);
      Alert.alert('Error', 'Failed to request overlay permission');
    } finally {
      setLoading(false);
    }
  };

  const renderPermissionItem = (permission: string, granted: boolean) => (
    <View key={permission} style={styles.permissionItem}>
      <Text style={styles.permissionName}>
        {permission.replace('android.permission.', '')}
      </Text>
      <Text style={[styles.status, granted ? styles.granted : styles.denied]}>
        {granted ? '✅ Granted' : '❌ Denied'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Checking Permissions...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Android 15 Permission Test</Text>
      
      {Platform.OS === 'android' && permissionStatus && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Info</Text>
            <Text style={styles.info}>Android Version: {permissionStatus.androidVersion}</Text>
            <Text style={styles.info}>Target SDK: {permissionStatus.targetSdk}</Text>
            <Text style={[styles.info, permissionStatus.canMakeVoipCalls ? styles.granted : styles.denied]}>
              Can Make VoIP Calls: {permissionStatus.canMakeVoipCalls ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Essential Permissions</Text>
            {permissionStatus.essentialGranted.map(permission => 
              renderPermissionItem(permission, true)
            )}
            {permissionStatus.essentialMissing.map(permission => 
              renderPermissionItem(permission, false)
            )}
          </View>

          {Object.keys(permissionStatus.foregroundServicePermissions).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Foreground Service Permissions</Text>
              {Object.entries(permissionStatus.foregroundServicePermissions).map(([key, granted]) =>
                renderPermissionItem(key, granted)
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Permissions</Text>
            {renderPermissionItem('SYSTEM_ALERT_WINDOW', permissionStatus.canDrawOverlays)}
          </View>

          <View style={styles.buttonSection}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => requestPermissions(false)}
            >
              <Text style={styles.buttonText}>Request Audio Call Permissions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button} 
              onPress={() => requestPermissions(true)}
            >
              <Text style={styles.buttonText}>Request Video Call Permissions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button} 
              onPress={requestOverlayPermission}
            >
              <Text style={styles.buttonText}>Request Overlay Permission</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.refreshButton]} 
              onPress={checkPermissions}
            >
              <Text style={styles.buttonText}>Refresh Status</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {Platform.OS !== 'android' && (
        <Text style={styles.info}>This screen is only available on Android</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  permissionName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  granted: {
    color: '#4CAF50',
  },
  denied: {
    color: '#F44336',
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  buttonSection: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PermissionTestScreen;