import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  DeviceEventEmitter,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  endCall,
  joinCall,
  sendDTMF,
  toggleHold,
  transferCall,
  getAudio,
  setAudio,
  getCurrentAudio,
  getCurrentUser,
  getGuestUser,
  getInitialCall,
  OmiCallEvent,
  OmiCallState,
} from 'omikit-plugin';

import {
  CustomSound,
  CustomTimer,
  KeyboardAvoid,
  UIColors,
} from './components';
import { CustomKeyboard } from './components/custom_view/custom_keyboard';
import { UserView } from './components/custom_view/user_view';
import { UIImages } from '../assets';
import { LiveData } from './livedata';

// Status descriptions for call states
const STATUS_DESCRIPTIONS: Record<number, string> = {
  [OmiCallState.calling]: 'Connecting to call',
  [OmiCallState.connecting]: 'Connecting',
  [OmiCallState.early]: 'Ringing',
  [OmiCallState.confirmed]: 'Call started',
  [OmiCallState.disconnected]: 'Call ended',
  [OmiCallState.hold]: 'On hold',
};

// Audio device names
const AUDIO_DEVICE = {
  RECEIVER: 'Receiver',
  SPEAKER: 'Speaker',
} as const;

interface RouteParams {
  status: number;
  isOutGoingCall: boolean;
  callerNumber?: string;
}

export const DialCallScreen = ({ route }: { route: { params: RouteParams } }) => {
  const navigation: any = useNavigation();
  const { status: initialStatus, isOutGoingCall } = route.params;

  // Call state
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isMuted, setIsMuted] = useState(false);

  // UI state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSoundPickerVisible, setIsSoundPickerVisible] = useState(false);
  const [dtmfInput, setDtmfInput] = useState('');

  // Audio state
  const [currentAudioDevice, setCurrentAudioDevice] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<any[]>([]);

  // User info state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [guestUser, setGuestUser] = useState<any>(null);

  // Get status description text
  const statusText = useMemo(
    () => STATUS_DESCRIPTIONS[currentStatus] || '',
    [currentStatus]
  );

  // Check if call is in active state (confirmed or hold)
  const isCallActive = currentStatus === OmiCallState.confirmed || currentStatus === OmiCallState.hold;

  // Check if showing answer button (incoming call not yet answered)
  const showAnswerButton =
    (currentStatus === OmiCallState.incoming || currentStatus === OmiCallState.early) &&
    !isOutGoingCall;

  // Get audio device icon
  const audioIcon = useMemo(() => {
    switch (currentAudioDevice) {
      case AUDIO_DEVICE.RECEIVER:
        return UIImages.icIphone;
      case AUDIO_DEVICE.SPEAKER:
        return UIImages.icSpeaker;
      default:
        return UIImages.icAirPod;
    }
  }, [currentAudioDevice]);

  // Fetch current and guest user info
  const fetchUserInfo = useCallback(async () => {
    const [current, guest] = await Promise.all([
      getCurrentUser(),
      getGuestUser(),
    ]);
    setCurrentUser(current);
    setGuestUser(guest);
  }, []);

  // Fetch current audio device
  const fetchCurrentAudio = useCallback(async () => {
    try {
      const audioData = await getCurrentAudio();
      if (audioData?.[0]?.name) {
        setCurrentAudioDevice(audioData[0].name);
      }
    } catch (error) {
      console.log('Error fetching current audio:', error);
    }
  }, []);

  // Handle call state changes
  const handleCallStateChanged = useCallback(async (data: any) => {
    const { status } = data;
    console.log('Call state changed:', status);
    setCurrentStatus(status);

    if (status === OmiCallState.disconnected) {
      navigation.goBack();
    }

    if (status === OmiCallState.confirmed) {
      const callInfo = await getInitialCall();
      console.log('Call confirmed:', callInfo);
    }
  }, [navigation]);

  // Handle mute state changes
  const handleMuteChanged = useCallback((data: any) => {
    console.log('Mute state changed:', data);
    setIsMuted(data);
  }, []);

  // Handle hold state changes
  const handleHoldChanged = useCallback((data: any) => {
    console.log('Hold state changed:', data);
  }, []);

  // Handle call quality changes
  const handleCallQuality = useCallback((data: any) => {
    console.log('Call quality:', data.quality);
  }, []);

  // Handle audio device changes
  const handleAudioChanged = useCallback((audioData: any) => {
    const { data } = audioData;
    if (data?.length > 0) {
      setCurrentAudioDevice(data[0].name);
    }
  }, []);

  // Handle switchboard answer
  const handleSwitchboardAnswer = useCallback(async (data: any) => {
    console.log('Switchboard answer:', data.sip);
    const guest = await getGuestUser();
    setGuestUser(guest);
  }, []);

  // Handle permission request
  const handlePermissionRequest = useCallback((data: any) => {
    console.log('Permission request:', data);
  }, []);

  // Toggle audio device (speaker/receiver/bluetooth)
  const toggleAudioDevice = useCallback(async () => {
    const devices = await getAudio();

    // If more than 2 devices, show picker
    if (devices.length > 2) {
      setAudioDevices(devices);
      setIsSoundPickerVisible(true);
      return;
    }

    // Toggle between receiver and speaker
    const targetDevice = currentAudioDevice === AUDIO_DEVICE.RECEIVER
      ? AUDIO_DEVICE.SPEAKER
      : AUDIO_DEVICE.RECEIVER;

    const device = devices.find((d: any) => d.name === targetDevice);
    if (device) {
      setAudio({ portType: device.type });
    }
  }, [currentAudioDevice]);

  // Select audio device from picker
  const selectAudioDevice = useCallback((device: any) => {
    setIsSoundPickerVisible(false);
    setAudio({ portType: device.type });
  }, []);

  // Send DTMF tone
  const sendDtmfTone = useCallback((digit: string) => {
    setDtmfInput(prev => prev + digit);
    sendDTMF({ character: digit });
  }, []);

  // Close DTMF keyboard
  const closeDtmfKeyboard = useCallback(() => {
    setDtmfInput('');
    setIsKeyboardVisible(false);
  }, []);

  // Toggle hold
  const handleToggleHold = useCallback(() => {
    toggleHold();
  }, []);

  // Transfer call
  const handleTransferCall = useCallback(() => {
    try {
      transferCall({ phoneNumber: '101' });
    } catch (error) {
      console.log('Transfer call error:', error);
    }
  }, []);

  // End current call
  const handleEndCall = useCallback(() => {
    endCall();
    navigation.goBack();
  }, [navigation]);

  // Answer incoming call
  const handleAnswerCall = useCallback(async () => {
    await joinCall();
  }, []);

  // Register event listeners
  useEffect(() => {
    const listeners = [
      DeviceEventEmitter.addListener(OmiCallEvent.onCallStateChanged, handleCallStateChanged),
      DeviceEventEmitter.addListener(OmiCallEvent.onMuted, handleMuteChanged),
      DeviceEventEmitter.addListener(OmiCallEvent.onHold, handleHoldChanged),
      DeviceEventEmitter.addListener(OmiCallEvent.onCallQuality, handleCallQuality),
      DeviceEventEmitter.addListener(OmiCallEvent.onAudioChange, handleAudioChanged),
      DeviceEventEmitter.addListener(OmiCallEvent.onSwitchboardAnswer, handleSwitchboardAnswer),
      DeviceEventEmitter.addListener(OmiCallEvent.onRequestPermissionAndroid, handlePermissionRequest),
    ];

    LiveData.isOpenedCall = true;

    return () => {
      listeners.forEach(listener => listener.remove());
      LiveData.isOpenedCall = false;
    };
  }, [
    handleCallStateChanged,
    handleMuteChanged,
    handleHoldChanged,
    handleCallQuality,
    handleAudioChanged,
    handleSwitchboardAnswer,
    handlePermissionRequest,
  ]);

  // Disable hardware back button
  useEffect(() => {
    const onBackPress = () => true;
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, []);

  // Initialize user info and audio
  useEffect(() => {
    fetchUserInfo();
    fetchCurrentAudio();
  }, [fetchUserInfo, fetchCurrentAudio]);

  // Render call controls when call is active
  const renderCallControls = () => {
    if (!isCallActive) return null;

    // Show DTMF keyboard
    if (isKeyboardVisible) {
      return (
        <View style={styles.keyboard}>
          <CustomKeyboard
            callback={sendDtmfTone}
            title={dtmfInput}
            close={closeDtmfKeyboard}
          />
        </View>
      );
    }

    // Show sound picker
    if (isSoundPickerVisible) {
      return (
        <CustomSound
          sounds={audioDevices}
          callback={selectAudioDevice}
          close={() => setIsSoundPickerVisible(false)}
        />
      );
    }

    // Show default controls
    return (
      <View style={styles.feature}>
        <TouchableOpacity onPress={handleToggleHold}>
          <Image
            source={isMuted ? UIImages.micOff : UIImages.micOn}
            style={styles.featureImage}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsKeyboardVisible(true)}>
          <Image source={UIImages.comment} style={styles.featureImage} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleTransferCall}>
          <Image source={UIImages.icChange} style={styles.featureImage} />
        </TouchableOpacity>

        {currentAudioDevice && (
          <TouchableOpacity onPress={toggleAudioDevice}>
            <Image source={audioIcon} style={styles.featureImage} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoid>
      <View style={styles.background}>
        {/* User avatars */}
        <View style={styles.titleBackground}>
          <UserView
            full_name={currentUser?.extension}
            avatar_url={currentUser?.avatar_url}
          />
          <UserView
            full_name={guestUser?.extension}
            avatar_url={guestUser?.avatar_url}
          />
        </View>

        {/* Call status */}
        <Text style={styles.status}>{statusText}</Text>

        {/* Call timer */}
        <View style={styles.title}>
          {isCallActive && <CustomTimer />}
        </View>

        {/* Call controls */}
        <View style={styles.feature}>
          {renderCallControls()}
        </View>

        {/* Call action buttons */}
        <View style={styles.call}>
          <TouchableOpacity onPress={handleEndCall}>
            <Image source={UIImages.hangup} style={styles.hangup} />
          </TouchableOpacity>

          {showAnswerButton && (
            <TouchableOpacity onPress={handleAnswerCall}>
              <Image source={UIImages.joinCall} style={styles.hangup} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoid>
  );
};

const styles = StyleSheet.create({
  background: {
    paddingHorizontal: 24,
    paddingVertical: 36,
    marginTop: 24,
    alignItems: 'center',
    flex: 1,
  },
  titleBackground: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
  },
  title: {
    marginTop: 16,
    marginBottom: 24,
  },
  status: {
    fontSize: 20,
    color: UIColors.textColor,
    marginTop: 16,
  },
  feature: {
    flexGrow: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  keyboard: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center',
  },
  featureImage: {
    width: 50,
    height: 50,
  },
  hangup: {
    width: 60,
    height: 60,
  },
  call: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
});
