import { useNavigation } from '@react-navigation/native';
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  ScrollView,
  Linking,
  Alert,
  TouchableOpacity,
} from 'react-native';

import {
  initCallWithUserPassword,
  getCurrentUser,
  logoutAndWait,
  getProjectId,
  getAppId,
  getDeviceId,
  getFcmToken,
  getSipInfo,
  getVoipToken,
  getOmiDevices,
  isCurrentDeviceRegistered,
  needsReLogin,
  findSipNumberByDeviceId,
} from 'omikit-plugin';

import LocalStorage from './local_storage';
import { requestNotification, token } from './notification';

import {
  CustomButton,
  CustomCheckBox,
  CustomTextField,
  KeyboardAvoid,
} from './components';
import { CustomLoading } from './components/custom_view/custom_loading';

// ============================================================================
// CONSTANTS
// ============================================================================

// Default credentials for testing
// Replace with your SIP credentials from OMICall dashboard
const DEFAULT_CREDENTIALS = {
  realm: '',
  userName: '',
  password: '',
  host: '',
  projectId: '',
};

// Error messages mapping for user-friendly display
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Missing required parameters. Please check your configuration.',
  401: 'Invalid credentials. Please check username/password.',
  450: 'Microphone permission required. Please grant RECORD_AUDIO permission.',
  451: 'Foreground service permission required.',
  452: 'Notification permission required. Please enable notifications.',
  500: 'Failed to start SIP service. Please try again.',
  501: 'SIP service not available.',
  600: 'Network unavailable. Please check your connection.',
  601: 'Connection timeout. Please try again.',
};

// ============================================================================
// TYPES
// ============================================================================

interface LoginInfo {
  userName: string;
  password: string;
  realm: string;
  isVideo: boolean;
  fcmToken: string;
  host: string;
  projectId: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse error message from initCallWithUserPassword error
 * Example error: [Error: RECORD_AUDIO permission required for Android 14+ (Status: 450)]
 */
const parseErrorMessage = (error: any): string => {
  const errorString = error?.message || error?.toString() || 'Unknown error';

  // Try to extract status code from error message
  const statusMatch = errorString.match(/Status:\s*(\d+)/);
  if (statusMatch) {
    const statusCode = parseInt(statusMatch[1], 10);
    if (ERROR_MESSAGES[statusCode]) {
      return ERROR_MESSAGES[statusCode];
    }
  }

  // Return the original error message if no mapping found
  return errorString;
};

/**
 * Show error alert to user
 */
const showErrorAlert = (title: string, message: string) => {
  Alert.alert(
    title,
    message,
    [{ text: 'OK', style: 'default' }],
    { cancelable: true }
  );
};


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LoginScreen = () => {
  // Navigation
  const navigation: any = useNavigation();

  // Form state
  const [userName, setUserName] = useState(DEFAULT_CREDENTIALS.userName);
  const [password, setPassword] = useState(DEFAULT_CREDENTIALS.password);
  const [realm, setRealm] = useState(DEFAULT_CREDENTIALS.realm);
  const [host, setHost] = useState(DEFAULT_CREDENTIALS.host);
  const [isVideo, setIsVideo] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [sdkInfo, setSdkInfo] = useState<Record<string, string | null> | null>(null);

  // Input refs for focus management
  const userNameRef = useRef<TextInput>() as MutableRefObject<TextInput>;
  const passwordRef = useRef<TextInput>() as MutableRefObject<TextInput>;
  const realmRef = useRef<TextInput>() as MutableRefObject<TextInput>;
  const hostRef = useRef<TextInput>() as MutableRefObject<TextInput>;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Request notification permission on mount
  useEffect(() => {
    requestNotification();
  }, []);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('Received deep link:', event.url);
      // TODO: Handle navigation based on deep link
    };

    // Check if app was opened from a deep link (cold start)
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          console.log('App opened with URL:', url);
        }
      })
      .catch((err) => console.error('Deep link error:', err));

    // Listen for deep link events (warm start)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Fetch SDK info (test before/after login)
   */
  const fetchSdkInfo = async () => {
    try {
      console.log('[SDK_INFO] Fetching on login screen (before login)...');
      const [projectId, appId, deviceId, fcmToken, sipInfo, voipToken] =
        await Promise.all([
          getProjectId(),
          getAppId(),
          getDeviceId(),
          getFcmToken(),
          getSipInfo(),
          getVoipToken(),
        ]);
      const info = { projectId, appId, deviceId, fcmToken, sipInfo, voipToken };
      console.log('[SDK_INFO] Result:', info);
      setSdkInfo(info);
    } catch (error) {
      console.log('[SDK_INFO] Error:', error);
      setSdkInfo(null);
      Alert.alert('SDK Info Error', String(error));
    }
  };

  /**
   * Pre-login device-registration check.
   * Before login, getCurrentSip is nil → all 3 APIs should return empty/false.
   * This button mainly verifies that the JS bridge is wired correctly and that
   * the SDK returns the safe "not logged in" defaults on Login screen.
   */
  const checkDeviceRegistration = async () => {
    try {
      console.log('[DEVICE_CHECK] === BEFORE LOGIN ===');
      const localDeviceId = await getDeviceId();
      const localAppId = await getAppId();
      console.log('[DEVICE_CHECK] localDeviceId:', localDeviceId);
      console.log('[DEVICE_CHECK] localAppId:', localAppId);

      const devices = await getOmiDevices();
      console.log('[DEVICE_CHECK] getOmiDevices() count:', devices.length);
      console.log('[DEVICE_CHECK] getOmiDevices() log:', devices);
      console.log('[DEVICE_CHECK] getOmiDevices() payload:', JSON.stringify(devices, null, 2));

      // Manual element-wise comparison to make the registration decision visible.
      // Native isCurrentDeviceRegistered does the same comparison but only returns
      // a single bool — this loop shows the per-device match for debugging.
      console.log('[DEVICE_CHECK] --- per-device comparison ---');
      devices.forEach((d, i) => {
        const idMatch = d.deviceId === localDeviceId;
        const appMatch = d.appId === localAppId;
        console.log(
          `[DEVICE_CHECK] [${i}] sipNumber=${d.sipNumber ?? 'null'} ` +
            `deviceId=${d.deviceId ?? 'null'} (match=${idMatch}) ` +
            `appId=${d.appId ?? 'null'} (match=${appMatch}) ` +
            `=> overall=${idMatch && appMatch}`
        );
      });
      const localMatchedEntry = devices.find(
        (d) => d.deviceId === localDeviceId && d.appId === localAppId
      );
      console.log('[DEVICE_CHECK] localMatchedEntry:', localMatchedEntry ?? 'NOT FOUND');
      console.log('[DEVICE_CHECK] sipNumber of matched entry:', localMatchedEntry?.sipNumber ?? 'NOT FOUND');

      // Use the plugin helper to look up sipNumber by deviceId — same result
      // as the manual .find() above but via the public API.
      const sipNumberFromHelper = findSipNumberByDeviceId(devices, localDeviceId);
      console.log('[DEVICE_CHECK] findSipNumberByDeviceId():', sipNumberFromHelper ?? 'NOT FOUND');

      // Compare backend-bound sipNumber with the extension the user typed.
      // Mismatch means the local device is registered under a DIFFERENT
      // extension than the credentials in the form — re-login with the new
      // credentials would silently overwrite the backend record.
      const expectedSipNumber = DEFAULT_CREDENTIALS.userName;
      const sipNumberMatches = sipNumberFromHelper === expectedSipNumber;
      console.log('[DEVICE_CHECK] expected sipNumber (form):', expectedSipNumber);
      console.log('[DEVICE_CHECK] backend sipNumber (helper):', sipNumberFromHelper ?? 'NOT FOUND');
      console.log('[DEVICE_CHECK] sipNumber matches form?:', sipNumberMatches);

      console.log(
        '[DEVICE_CHECK] all sipNumbers on backend:',
        devices.map((d) => d.sipNumber)
      );

      const registered = await isCurrentDeviceRegistered();
      console.log('[DEVICE_CHECK] isCurrentDeviceRegistered:', registered);

      const needsRelogin = await needsReLogin();
      console.log('[DEVICE_CHECK] needsReLogin:', needsRelogin);
      console.log(
        '[DEVICE_CHECK] Why needsReLogin =',
        needsRelogin,
        ':',
        needsRelogin
          ? 'local SIP exists but no matching device on backend → must logout + login again'
          : devices.length === 0
            ? 'not logged in locally OR backend returned empty → nothing to recover'
            : 'local deviceId+appId matched a backend entry → session intact'
      );

      Alert.alert(
        'Device Check (Before Login)',
        `localDeviceId: ${localDeviceId ?? 'null'}\n` +
          `localAppId: ${localAppId ?? 'null'}\n` +
          `devices on backend: ${devices.length}\n` +
          `isCurrentDeviceRegistered: ${registered}\n` +
          `needsReLogin: ${needsRelogin}\n\n` +
          `Expected sipNumber (form): ${expectedSipNumber}\n` +
          `Backend sipNumber (helper): ${sipNumberFromHelper ?? 'NOT FOUND'}\n` +
          `Match: ${sipNumberMatches ? '✅ same extension' : '❌ different extension'}`
      );
    } catch (error) {
      console.log('[DEVICE_CHECK] Error:', error);
      Alert.alert('Device Check Error', String(error));
    }
  };

  /**
   * Handle user login with OmiKit
   */
  const handleLogin = async () => {
    // Validate required fields
    if (!userName.trim()) {
      showErrorAlert('Validation Error', 'Please enter your username.');
      return;
    }
    if (!password.trim()) {
      showErrorAlert('Validation Error', 'Please enter your password.');
      return;
    }
    if (!realm.trim()) {
      showErrorAlert('Validation Error', 'Please enter your realm.');
      return;
    }

    setLoading(true);

    try {
      // Get FCM token for push notifications
      console.log('[LOGIN] Step 1: Getting FCM token...');
      let fcmToken = '';
      try {
        fcmToken = (await token) || '';
      } catch (e) {
        console.log('[LOGIN] Step 1: FCM token failed, continuing without it:', e);
      }
      console.log('[LOGIN] Step 1 done - FCM Token:', fcmToken || '(empty)');

      // Prepare login info
      const loginInfo: LoginInfo = {
        userName: userName.trim(),
        password: password.trim(),
        realm: realm.trim(),
        host: host.trim(),
        isVideo,
        fcmToken: fcmToken || '',
        projectId: DEFAULT_CREDENTIALS.projectId,
      };

      console.log('[LOGIN] Step 2: Login info prepared:', JSON.stringify({
        ...loginInfo,
        password: '***',
        fcmToken: fcmToken ? `${fcmToken.substring(0, 10)}...` : 'empty',
      }));

      // Preflight: check backend device registration before login.
      // Two cases require a logout to clean up the previous local SIP session
      // before initCallWithUserPassword runs — otherwise the new register
      // would carry stale credentials and the backend device record would be
      // bound to the wrong extension.
      //
      //   1. devices == []   → backend has no record (logout, reinstall,
      //                        backend cleanup, or first install). Local SIP
      //                        is either absent or stale → safe to logout.
      //   2. sipNumber       → backend has a device but it's bound to a
      //      mismatch          DIFFERENT extension than the one being logged
      //                        in. Continuing without logout would overwrite
      //                        the old record silently.
      console.log('[LOGIN] Step 3: Preflight device-registration check...');
      try {
        const preflightDevices = await getOmiDevices();
        const preflightDeviceId = await getDeviceId();
        const preflightSip = findSipNumberByDeviceId(
          preflightDevices,
          preflightDeviceId
        );
        const targetSip = loginInfo.userName;

        const shouldLogout = preflightSip !== targetSip;

        console.log('[LOGIN] Step 3 — devices.length:', preflightDevices.length);
        console.log('[LOGIN] Step 3 — backend sipNumber:', preflightSip ?? 'NOT FOUND');
        console.log('[LOGIN] Step 3 — target sipNumber (form):', targetSip);
        console.log('[LOGIN] Step 3 — shouldLogout:', shouldLogout);

        if (shouldLogout) {
          // logoutAndWait resolves only after the SDK has finished both
          // HTTP devices/remove AND the local SIP state reset — no race
          // with the upcoming devices/add.
          console.log('[LOGIN] Step 3 — Calling logoutAndWait() to clear stale session...');
          const t0 = Date.now();
          const ok = await logoutAndWait();
          console.log(
            `[LOGIN] Step 3 — logoutAndWait() done in ${Date.now() - t0}ms, success=${ok}`
          );
        } else {
          console.log('[LOGIN] Step 3 — No logout needed (device bound to same extension)');
        }
      } catch (e) {
        // Preflight failures are non-fatal — continue with login. Worst case
        // initCallWithUserPassword handles the cleanup itself.
        console.log('[LOGIN] Step 3 — preflight error, continuing:', e);
      }

      // Check current user state
      console.log('[LOGIN] Step 4: Checking current user...');
      const currentUser = await getCurrentUser();
      console.log('[LOGIN] Step 4 done - Current user:', currentUser);

      // Attempt login
      console.log('[LOGIN] Step 5: Calling initCallWithUserPassword...');
      const startTime = Date.now();
      const result = await initCallWithUserPassword(loginInfo);
      const elapsed = Date.now() - startTime;
      console.log(`[LOGIN] Step 5 done - Result: ${result} (took ${elapsed}ms)`);

      if (result) {
        // Verify login was successful
        console.log('[LOGIN] Step 6: Verifying user...');
        const verifiedUser = await getCurrentUser();
        console.log('[LOGIN] Step 6 done - Verified user:', verifiedUser);

        // Save login info for auto-login
        LocalStorage.set('login_info', JSON.stringify(loginInfo));
        console.log('[LOGIN] SUCCESS - Navigating to Home');

        // Navigate to home screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        console.log('[LOGIN] FAILED - result is falsy:', result);
        showErrorAlert(
          'Login Failed',
          'Unable to initialize call service. Please check your credentials and try again.'
        );
      }
    } catch (error: any) {
      console.error('[LOGIN] ERROR at some step:', error);
      console.error('[LOGIN] Error name:', error?.name);
      console.error('[LOGIN] Error message:', error?.message);
      console.error('[LOGIN] Error code:', error?.code);

      // Parse and display user-friendly error message
      const errorMessage = parseErrorMessage(error);
      showErrorAlert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle video call option
   */
  const handleVideoToggle = useCallback(() => {
    setIsVideo((prev) => !prev);
  }, []);

  /**
   * Test universal link / deep link functionality
   */
  const handleTestUniversalLink = async () => {
    try {
      const omiLink =
        'omicall-call:0346066476&deeplink=tasetco-delivery&param1=MKP-KH19-000028&param2=ITVINATESTTONGDAI1';

      const canOpen = await Linking.canOpenURL(omiLink);
      if (canOpen) {
        await Linking.openURL(omiLink);
      } else {
        showErrorAlert('Cannot Open Link', `Unable to open: ${omiLink}`);
      }
    } catch (error) {
      console.error('Universal link error:', error);
      showErrorAlert('Error', 'An error occurred while opening the link.');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <KeyboardAvoid>
      <ScrollView style={styles.container}>
        {/* Username Input */}
        <CustomTextField
          label="User name"
          placeHolder="Enter username"
          value={userName}
          returnKey="next"
          currentFocus={userNameRef}
          nextFocus={passwordRef}
          onChange={setUserName}
        />

        {/* Password Input */}
        <CustomTextField
          label="Password"
          placeHolder="Enter password"
          style={styles.inputSpacing}
          value={password}
          isPassword={false}
          currentFocus={passwordRef}
          nextFocus={realmRef}
          onChange={setPassword}
        />

        {/* Realm Input */}
        <CustomTextField
          label="Realm"
          placeHolder="Enter realm"
          style={styles.inputSpacing}
          value={realm}
          isPassword={false}
          currentFocus={realmRef}
          nextFocus={hostRef}
          onChange={setRealm}
        />

        {/* Host Input */}
        <CustomTextField
          label="Host"
          placeHolder="vh.omicrm.com"
          style={styles.inputSpacing}
          value={host}
          isPassword={false}
          currentFocus={hostRef}
          onChange={setHost}
        />

        {/* Video Call Checkbox */}
        <CustomCheckBox
          title="Video call"
          checked={isVideo}
          callback={handleVideoToggle}
          style={styles.checkbox}
        />

        {/* Login Button */}
        <CustomButton
          title="LOGIN"
          callback={handleLogin}
          style={styles.button}
        />

        {/* Test Universal Link Button */}
        <CustomButton
          title="Test Universal Link"
          callback={handleTestUniversalLink}
          style={styles.button}
        />

        {/* SDK Info Test Section */}
        <TouchableOpacity style={styles.sdkInfoButton} onPress={fetchSdkInfo}>
          <Text style={styles.sdkInfoButtonText}>GET SDK INFO (Before Login)</Text>
        </TouchableOpacity>

        {/* Device Registration Check (Before Login) */}
        <TouchableOpacity style={styles.deviceCheckButton} onPress={checkDeviceRegistration}>
          <Text style={styles.sdkInfoButtonText}>CHECK DEVICE REGISTRATION</Text>
        </TouchableOpacity>

        {sdkInfo && (
          <View style={styles.sdkInfoBox}>
            <Text style={styles.sdkInfoTitle}>SDK Info</Text>
            {Object.entries(sdkInfo).map(([key, value]) => (
              <View key={key} style={styles.sdkInfoRow}>
                <Text style={styles.sdkInfoLabel}>{key}:</Text>
                <Text style={styles.sdkInfoValue} numberOfLines={1}>
                  {value ?? 'null'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Loading Indicator */}
        {loading && <CustomLoading />}
      </ScrollView>
    </KeyboardAvoid>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: 60
  },
  inputSpacing: {
    marginTop: 16,
  },
  checkbox: {
    marginTop: 24,
  },
  button: {
    marginTop: 24,
  },
  sdkInfoButton: {
    marginTop: 16,
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  deviceCheckButton: {
    marginTop: 12,
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginBottom: 50,
  },
  sdkInfoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sdkInfoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 50,
  },
  sdkInfoTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 8,
    color: '#333',
  },
  sdkInfoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 3,
  },
  sdkInfoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600' as const,
  },
  sdkInfoValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'right' as const,
    marginLeft: 8,
  },
});
