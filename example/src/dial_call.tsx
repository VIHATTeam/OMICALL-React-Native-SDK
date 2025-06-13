import {
  BackHandler,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CustomSound,
  CustomTimer,
  KeyboardAvoid,
  UIColors,
} from './components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  endCall,
  OmiCallEvent,
  omiEmitter,
  sendDTMF,
  joinCall,
  getCurrentUser,
  getGuestUser,
  OmiCallState,
  getCurrentAudio,
  getAudio,
  setAudio,
  getInitialCall,
  transferCall,
  toggleHold,
  testEventEmission,
  dropCall
  // getAutoUnregisterStatus, // Comment out until exported
  // preventAutoUnregister // Comment out until exported
} from 'omikit-plugin';
const { DeviceEventEmitter } = require('react-native');
import { UIImages } from '../assets';
import { useNavigation } from '@react-navigation/native';
import { CustomKeyboard } from './components/custom_view/custom_keyboard';
import { LiveData } from './livedata';
import { UserView } from './components/custom_view/user_view';

const StatusDescriptions: { [key: number]: string } = {
  [OmiCallState.calling]: 'Đang kết nối tới cuộc gọi',
  [OmiCallState.connecting]: 'Đang kết nối',
  [OmiCallState.early]: 'Cuộc gọi đang đổ chuông',
  [OmiCallState.confirmed]: 'Cuộc gọi bắt đầu',
  [OmiCallState.disconnected]: 'Cuộc gọi kết thúc',
  [OmiCallState.hold]: 'Đang giữ cuộc gọi'
};

export const DialCallScreen = ({ route }: any) => {
  // const callerNumber = route.params.callerNumber;
  const navigation = useNavigation();
  const [currentStatus, setCurrentStatus] = useState(route.params.status);
  const isOutGoingCall = route.params.isOutGoingCall;
  const [currentAudio, setCurrentAudio] = useState<any>(null);
  const [muted, setMuted] = useState(false);
  const [keyboardOn, setKeyboardOn] = useState(false);
  const [onSoundSelection, setOnSoundSelection] = useState(false);
  const [soundList, setSoundList] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [guestUser, setGuestUser] = useState<any>(null);
  const [_transaction_id, _setTransaction_id] = useState('');

  const getDescriptionFromStatus = (status: number): string => {
    console.log('status getDescriptionFromStatus ==> ', status);
    if (status == null) return '';

    return StatusDescriptions[status] || '';
  };

  const currentStatusText = useMemo(
    () => getDescriptionFromStatus(currentStatus ?? 0),
    [currentStatus]
  );

  const callStateChanged = useCallback(async (data: any) => {
    console.log('🚀 callStateChanged triggered with data:', data);
    const { status, code_end_call } = data;
    console.log('Status CallStateChanged =>>>  ', status, code_end_call);
    // if(currentStatus != status && (currentStatus == OmiCallState.confirmed )){ // chặn update status cuộc gọi, khi đang trong cuộc gọi hiện tại
    //   return
    // }
    setCurrentStatus(status);
    if (status === OmiCallState.disconnected) {
      const callInfo = await getInitialCall();
      console.log('callInfo getInitialCall ==> ', callInfo);
      navigation.goBack();
    }
    if (status === OmiCallState.confirmed) {
      const callInfo = await getInitialCall();
      console.log(callInfo);
    }
  }, [navigation]);

  const onMuted = useCallback((data: any) => {
    console.log('onMuted');
    // const isMuted = data.isMuted;
    console.log('is muted ' + data);
    setMuted(data);
  }, []);

  const onHold = useCallback((data: any) => {
    console.log('onHold');
    // const isMuted = data.isMuted;
    console.log('is onHold ' + data);
    // setMuted(data);
  }, []);

  const pressKeyCap = useCallback(
    (text: string) => {
      setTitle(title + text);
      sendDTMF({
        character: text,
      });
    },
    [title]
  );

  const pressSoundType = useCallback((data: any) => {
    setOnSoundSelection(false);
    setAudio({
      portType: data.type,
    });
  }, []);

  const triggerHold = useCallback(() => {
    // setMicOn((prev) => !prev);
    toggleHold();
  }, []);

  const onSwitchboardAnswer = useCallback(async (data: any) => {
    const { sip } = data;
    console.log(sip);
    const guest = await getGuestUser();
    setGuestUser(guest);
  }, []);

  const onCallQuality = useCallback((data: any) => {
    const { quality } = data;
    console.log(quality);
  }, []);

  const onAudioChange = useCallback((audioData: any) => {
    const { data } = audioData;
    console.log("data with data --> ", data);
    if (data.length > 0) {
      const { name } = data[0];
      setCurrentAudio(name);
    }
  }, []);

  const toggleAndCheckDevice = useCallback(async () => {
    const audioList = await getAudio();
    if (audioList.length > 2) {
      setSoundList(audioList);
      setOnSoundSelection(true);
    } else {
      if (currentAudio === 'Receiver') {
        const speaker = audioList.find((element: any) => {
          return element.name === 'Speaker';
        });
        console.log(speaker);
        setAudio({
          portType: speaker.type,
        });
      } else {
        const receiver = audioList.find((element: any) => {
          return element.name === 'Receiver';
        });
        console.log(receiver);
        setAudio({
          portType: receiver.type,
        });
      }
    }
  }, [currentAudio]);

  const onReqPermission = useCallback((data: any) => {
    console.log('onReqPermission => ', data);
  }, []);

  useEffect(() => {
    console.log('🔧 Registering event listeners...');

    const onCallStateChanged = DeviceEventEmitter.addListener(
      OmiCallEvent.onCallStateChanged,
      callStateChanged
    );

    console.log('✅ onCallStateChanged listener registered:', OmiCallEvent.onCallStateChanged);

    DeviceEventEmitter.addListener(OmiCallEvent.onMuted, onMuted);
    DeviceEventEmitter.addListener(OmiCallEvent.onHold, onHold);
    DeviceEventEmitter.addListener(OmiCallEvent.onCallQuality, onCallQuality);
    DeviceEventEmitter.addListener(OmiCallEvent.onAudioChange, onAudioChange);
    DeviceEventEmitter.addListener(
      OmiCallEvent.onSwitchboardAnswer,
      onSwitchboardAnswer
    );

    DeviceEventEmitter.addListener(OmiCallEvent.onRequestPermissionAndroid, onReqPermission);

    // ✅ Test listener để kiểm tra kết nối
    const testListener = omiEmitter.addListener('test', (data) => {
      console.log('🧪 Test event received:', data);
    });

    LiveData.isOpenedCall = true;

    console.log('🎯 All event listeners registered successfully');

    return () => {
      console.log('🧹 Cleaning up event listeners...');
      onCallStateChanged.remove();
      DeviceEventEmitter.removeAllListeners(OmiCallEvent.onAudioChange);
      DeviceEventEmitter.removeAllListeners(OmiCallEvent.onMuted);
      DeviceEventEmitter.removeAllListeners(OmiCallEvent.onHold);
      DeviceEventEmitter.removeAllListeners(OmiCallEvent.onCallQuality);
      DeviceEventEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
      DeviceEventEmitter.removeAllListeners(OmiCallEvent.onSwitchboardAnswer);
      DeviceEventEmitter.removeAllListeners(OmiCallEvent.onRequestPermissionAndroid);
      testListener.remove();
      LiveData.isOpenedCall = false;
      console.log('✅ Event listeners cleaned up');
    };
  }, [callStateChanged, onMuted, onHold, onCallQuality, onAudioChange, onSwitchboardAnswer, onReqPermission]);

  useEffect(() => {
    getCurrentAudio().then((data: any) => {
      console.log('current audio');
      console.log(data);
      const { name } = data[0];
      setCurrentAudio(name);
    });
  }, []);

  const audioImage = () => {
    if (currentAudio === 'Receiver') {
      return UIImages.icIphone;
    }
    if (currentAudio === 'Speaker') {
      return UIImages.icSpeaker;
    }
    return UIImages.icAirPod;
  };

  useEffect(() => {
    const onBackPress = () => {
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, []);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    const current = await getCurrentUser();
    setCurrentUser(current);
    const guest = await getGuestUser();
    setGuestUser(guest);
  };

  const onPressTransferCall = () => {
    try {
      transferCall({ phoneNumber: '101' }); // func from omikit-plugin
    } catch (e) {
      console.log('e transferCall => ', e);
    }
  };

  // ✅ Test function để kiểm tra event emission
  const onPressTestEvent = async () => {
    try {
      console.log('🧪 Testing event emission...');
      const result = await testEventEmission();
      console.log('🧪 Test event result:', result);

      // ✅ Test AUTO-UNREGISTER status (comment out until functions are exported)
      // console.log('🔍 Checking AUTO-UNREGISTER status...');
      // const status = await getAutoUnregisterStatus();
      // console.log('📊 AUTO-UNREGISTER status:', status);

      // Test manual prevention (comment out until functions are exported)
      // const preventResult = await preventAutoUnregister('Manual test from React Native');
      // console.log('🛡️ Manual prevention result:', preventResult);
    } catch (e) {
      console.log('❌ Test event error:', e);
    }
  };

  return (
    <KeyboardAvoid>
      <View style={styles.background}>
        <View style={styles.titleBackground}>
          <UserView
            full_name={currentUser == null ? null : currentUser.extension}
            avatar_url={currentUser == null ? null : currentUser.avatar_url}
          />
          <UserView
            full_name={guestUser == null ? null : guestUser.extension}
            avatar_url={guestUser == null ? null : guestUser.avatar_url}
          />
        </View>
        <Text style={styles.status}>{currentStatusText}</Text>
        <View style={styles.title}>
          {currentStatus == OmiCallState.confirmed || currentStatus == OmiCallState.hold ? <CustomTimer /> : null}
        </View>
        <TouchableOpacity onPress={onPressTestEvent}>
          <Text style={{ color: 'red', fontSize: 12 }}>TEST</Text>
        </TouchableOpacity>
        <View style={styles.feature}>
          {currentStatus == OmiCallState.confirmed || currentStatus == OmiCallState.hold ? (
            keyboardOn ? (
              <View style={styles.keyboard}>
                <CustomKeyboard
                  callback={pressKeyCap}
                  title={title}
                  close={() => {
                    setTitle('');
                    setKeyboardOn(false);
                  }}
                />
              </View>
            ) : onSoundSelection ? (
              <CustomSound
                sounds={soundList}
                callback={pressSoundType}
                close={() => {
                  setOnSoundSelection(false);
                }}
              />
            ) : (
              <View style={styles.feature}>
                <TouchableOpacity onPress={triggerHold}>
                  <Image
                    source={!muted ? UIImages.micOn : UIImages.micOff}
                    style={styles.featureImage}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    console.log('keyboard on');
                    setKeyboardOn(true);
                  }}
                >
                  <Image
                    source={UIImages.comment}
                    style={styles.featureImage}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={onPressTransferCall}>
                  <Image
                    source={UIImages.icChange}
                    style={styles.featureImage}
                  />
                </TouchableOpacity>
                {currentAudio != null ? (
                  <TouchableOpacity onPress={toggleAndCheckDevice}>
                    <Image source={audioImage()} style={styles.featureImage} />
                  </TouchableOpacity>
                ) : null}
                {/* ✅ Test button để kiểm tra event emission */}
              </View>
            )
          ) : null}
        </View>
        <View style={styles.call}>
          <TouchableOpacity
            onPress={async () => {
              console.log('=>>>>>>>> end call  rejectCall =>>>>>>>>');
              dropCall();
              navigation.goBack();
              // rejectCall()
            }}
          >
            <Image source={UIImages.hangup} style={styles.hangup} />
          </TouchableOpacity>
          {(currentStatus == OmiCallState.incoming ||
            currentStatus == OmiCallState.early) &&
            isOutGoingCall == false ? (
            <TouchableOpacity
              onPress={async () => {
                await joinCall();
              }}
            >
              <Image source={UIImages.joinCall} style={styles.hangup} />
            </TouchableOpacity>
          ) : null}
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
  phone: {
    fontSize: 30,
    color: UIColors.textColor,
    fontWeight: '700',
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
