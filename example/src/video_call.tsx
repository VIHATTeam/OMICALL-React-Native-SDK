import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  OmiLocalCameraView,
  OmiRemoteCameraView,
  OmiCallEvent,
  OmiCallState,
  omiEmitter,
  endCall,
  joinCall,
  toggleMute,
  toggleSpeaker,
  toggleOmiVideo,
  switchOmiCamera,
  registerVideoEvent,
  removeVideoEvent,
  refreshRemoteCamera,
  refreshLocalCamera,
  toggleHold,
  getAudio,
  setAudio,
  getCurrentAudio,
  getCurrentUser,
  getGuestUser,
  setCameraConfig,
  setupVideoContainers,
} from 'omikit-plugin';

import {
  CustomSound,
  CustomTimer,
  KeyboardAvoid,
  UIColors,
} from './components';
import { UserView } from './components/custom_view/user_view';
import { UIImages } from '../assets';
import { LiveData } from './livedata';

// Status descriptions for video call states
const STATUS_DESCRIPTIONS: Record<number, string> = {
  [OmiCallState.calling]: 'Connecting video call...',
  [OmiCallState.connecting]: 'Connecting',
  [OmiCallState.early]: 'Ringing',
  [OmiCallState.confirmed]: 'Video call active',
  [OmiCallState.disconnected]: 'Call ended',
  [OmiCallState.hold]: 'On hold',
};

const AUDIO_DEVICE = {
  RECEIVER: 'Receiver',
  SPEAKER: 'Speaker',
} as const;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RouteParams {
  status: number;
  isOutGoingCall: boolean;
  callerNumber?: string;
}

export const VideoCallScreen = ({ route }: { route: { params: RouteParams } }) => {
  const navigation: any = useNavigation();
  const { status: initialStatus, isOutGoingCall } = route.params;

  // Call state
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isEnding, setIsEnding] = useState(false);
  const hasNavigated = useRef(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);

  // Audio state
  const [currentAudioDevice, setCurrentAudioDevice] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<any[]>([]);
  const [isSoundPickerVisible, setIsSoundPickerVisible] = useState(false);

  // User info state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [guestUser, setGuestUser] = useState<any>(null);

  // Derived state
  const statusText = useMemo(
    () => isEnding ? 'Ending call...' : (STATUS_DESCRIPTIONS[currentStatus] || ''),
    [currentStatus, isEnding]
  );
  const isCallActive = !isEnding && (currentStatus === OmiCallState.confirmed || currentStatus === OmiCallState.hold);
  const showAnswerButton =
    (currentStatus === OmiCallState.incoming || currentStatus === OmiCallState.early) &&
    !isOutGoingCall;

  // Audio device icon
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

  // Fetch user info
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

  // Configure iOS native camera views when call becomes active
  const configureIOSCameraViews = useCallback(() => {
    if (Platform.OS !== 'ios') return;
    // Remote: top portion, leaving bottom for React controls
    const controlsSpace = 200;
    setCameraConfig({
      target: 'remote',
      x: 0, y: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT - controlsSpace,
      scaleMode: 'fill',
      backgroundColor: '#1E3050',
    });
    // Local PiP: top-right corner
    setCameraConfig({
      target: 'local',
      x: SCREEN_WIDTH - 136, y: 60,
      width: 120, height: 180,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#FFFFFF40',
      scaleMode: 'fill',
    });
  }, []);

  // Handle call state changes
  const handleCallStateChanged = useCallback(
    (data: any) => {
      const { status } = data;
      console.log('Video call state changed:', status);
      setCurrentStatus(status);

      if (status === OmiCallState.confirmed) {
        console.log('[VIDEO] Confirmed — setting up video...');
        if (Platform.OS === 'android') {
          refreshRemoteCamera();
          refreshLocalCamera();
        } else {
          console.log('[VIDEO] iOS — calling setupVideoContainers...');
          setupVideoContainers()
            .then((result: any) => {
              console.log('[VIDEO] setupVideoContainers result:', result);
              configureIOSCameraViews();
            })
            .catch((err: any) => {
              console.error('[VIDEO] setupVideoContainers error:', err);
            });
        }
        return;
      }
      if ((status == OmiCallState.disconnected || status == 6) && !hasNavigated.current) {
        hasNavigated.current = true;
        console.log('[VIDEO] Disconnected — cleaning up and navigating to Home');
        // Hide native video containers immediately via setCameraConfig
        if (Platform.OS === 'ios') {
          setCameraConfig({ target: 'remote', hidden: true });
          setCameraConfig({ target: 'local', hidden: true });
        }
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }, 500);
      }
    },
    [navigation, configureIOSCameraViews]
  );

  // Handle mute state changes
  const handleMuteChanged = useCallback((data: any) => {
    setIsMuted(data);
  }, []);

  // Handle speaker state changes
  const handleSpeakerChanged = useCallback((data: any) => {
    setIsSpeakerOn(data);
  }, []);

  // Handle audio device changes
  const handleAudioChanged = useCallback((audioData: any) => {
    const { data } = audioData;
    if (data?.length > 0) {
      setCurrentAudioDevice(data[0].name);
    }
  }, []);

  // Handle remote video ready (iOS)
  const handleRemoteVideoReady = useCallback(() => {
    console.log('Remote video ready — refreshing cameras');
    refreshRemoteCamera();
    refreshLocalCamera();
    configureIOSCameraViews();
  }, [configureIOSCameraViews]);

  // Toggle audio device
  const toggleAudioDevice = useCallback(async () => {
    const devices = await getAudio();
    if (devices.length > 2) {
      setAudioDevices(devices);
      setIsSoundPickerVisible(true);
      return;
    }
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

  // Actions
  const handleEndCall = useCallback(() => {
    if (hasNavigated.current) return;
    setIsEnding(true);
    // Hide native video containers immediately
    if (Platform.OS === 'ios') {
      setCameraConfig({ target: 'remote', hidden: true });
      setCameraConfig({ target: 'local', hidden: true });
    }
    endCall();
    hasNavigated.current = true;
    setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }, 1000);
  }, [navigation]);

  const handleAnswerCall = useCallback(async () => {
    await joinCall();
  }, []);

  const handleToggleMute = useCallback(() => {
    toggleMute();
  }, []);

  const handleToggleSpeaker = useCallback(() => {
    toggleSpeaker();
  }, []);

  const handleToggleCamera = useCallback(() => {
    toggleOmiVideo();
    setCameraOn((prev) => !prev);
  }, []);

  const handleSwitchCamera = useCallback(() => {
    switchOmiCamera();
  }, []);

  const handleToggleHold = useCallback(() => {
    toggleHold();
  }, []);

  // Register event listeners
  useEffect(() => {
    const listeners = [
      omiEmitter.addListener(OmiCallEvent.onCallStateChanged, handleCallStateChanged),
      omiEmitter.addListener(OmiCallEvent.onMuted, handleMuteChanged),
      omiEmitter.addListener(OmiCallEvent.onSpeaker, handleSpeakerChanged),
      omiEmitter.addListener(OmiCallEvent.onAudioChange, handleAudioChanged),
    ];

    // iOS: register video events
    if (Platform.OS === 'ios') {
      registerVideoEvent();
      listeners.push(
        omiEmitter.addListener(OmiCallEvent.onRemoteVideoReady, handleRemoteVideoReady)
      );
    }

    LiveData.isOpenedCall = true;

    return () => {
      listeners.forEach((listener) => listener.remove());
      if (Platform.OS === 'ios') {
        removeVideoEvent();
      }
      LiveData.isOpenedCall = false;
    };
  }, [
    handleCallStateChanged,
    handleMuteChanged,
    handleSpeakerChanged,
    handleAudioChanged,
    handleRemoteVideoReady,
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

  // Camera views render natively via Fabric (iOS) or JSX (Android).
  // Controls overlay on top of video.
  return (
    <KeyboardAvoid>
      <View style={styles.container}>
        {/* Android: camera views via JSX. iOS: native window rendering via setupVideoContainers */}
        {Platform.OS === 'android' && isCallActive && (
          <>
            <OmiRemoteCameraView style={styles.remoteCamera} />
            <OmiLocalCameraView style={styles.localCamera} />
          </>
        )}

        {/* Info bar — before confirmed shows on full screen, after confirmed below video */}
        {!isCallActive && (
          <View style={styles.infoBar}>
            <UserView
              full_name={guestUser?.extension}
              avatar_url={guestUser?.avatar_url}
            />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        )}

        {/* Spacer — pushes controls to bottom */}
        <View style={styles.spacer} />

        {isSoundPickerVisible && (
          <CustomSound
            sounds={audioDevices}
            callback={selectAudioDevice}
            close={() => setIsSoundPickerVisible(false)}
          />
        )}

        <View style={styles.controlsPanel}>
          {isCallActive && (
            <View style={styles.featureRow}>
              <TouchableOpacity onPress={handleToggleMute} style={styles.featureBtn}>
                <View style={[styles.featureCircle, isMuted && styles.featureCircleActive]}>
                  <Image source={isMuted ? UIImages.micOff : UIImages.micOn} style={styles.featureIcon} />
                </View>
                <Text style={styles.featureLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleToggleCamera} style={styles.featureBtn}>
                <View style={[styles.featureCircle, !cameraOn && styles.featureCircleActive]}>
                  <Image source={cameraOn ? UIImages.audioOn : UIImages.audioOff} style={styles.featureIcon} />
                </View>
                <Text style={styles.featureLabel}>{cameraOn ? 'Cam Off' : 'Cam On'}</Text>
              </TouchableOpacity>

              {cameraOn && (
                <TouchableOpacity onPress={handleSwitchCamera} style={styles.featureBtn}>
                  <View style={styles.featureCircle}>
                    <Image source={UIImages.icChange} style={styles.featureIcon} />
                  </View>
                  <Text style={styles.featureLabel}>Flip</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleToggleHold} style={styles.featureBtn}>
                <View style={styles.featureCircle}>
                  <Image source={UIImages.comment} style={styles.featureIcon} />
                </View>
                <Text style={styles.featureLabel}>Hold</Text>
              </TouchableOpacity>

              {currentAudioDevice && (
                <TouchableOpacity onPress={toggleAudioDevice} style={styles.featureBtn}>
                  <View style={styles.featureCircle}>
                    <Image source={audioIcon} style={styles.featureIcon} />
                  </View>
                  <Text style={styles.featureLabel}>Audio</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleEndCall} style={styles.actionBtn}>
              <Image source={UIImages.hangup} style={styles.actionIcon} />
            </TouchableOpacity>
            {showAnswerButton && (
              <TouchableOpacity onPress={handleAnswerCall} style={styles.actionBtn}>
                <Image source={UIImages.joinCall} style={styles.actionIcon} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoid>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3050',
  },
  // Android: remote full screen
  remoteCamera: {
    ...StyleSheet.absoluteFillObject,
  },
  // Android: local PiP
  localCamera: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
  },
  // iOS: spacer matching native video height (window.height - 200)
  videoSpacer: {
    flex: 3,
  },
  // Info bar
  infoBar: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 15,
    color: '#fff',
    marginTop: 6,
  },
  spacer: {
    flex: 1,
  },
  // Controls
  controlsPanel: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  featureBtn: {
    alignItems: 'center',
    minWidth: 52,
  },
  featureCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCircleActive: {
    backgroundColor: 'rgba(255,80,80,0.8)',
  },
  featureIcon: {
    width: 26,
    height: 26,
    tintColor: '#fff',
  },
  featureLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
  },
});
