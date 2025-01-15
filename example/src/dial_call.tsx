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
  toggleMute,
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
  rejectCall
} from 'omikit-plugin';

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
  const [transaction_id, setTransaction_id] = useState('');

  const getDescriptionFromStatus = (status: number): string => {
    console.log('status getDescriptionFromStatus ==> ', status);
    if (status == null) return '';

    return StatusDescriptions[status] || '';
  };

  const currentStatusText = useMemo(
    () => getDescriptionFromStatus(currentStatus ?? 0),
    [currentStatus]
  );

  const callStateChanged = async (data: any) => {
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
  };

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

  const triggerMute = useCallback(async() => {
    // setMicOn((prev) => !prev);
    // toggleMute();
    try {
      const result = await toggleHold();
      console.log("result toggle hold -->", result);
    } catch (error) {
      console.log("error toggle hold -->", error);
    }
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
    if(data.length > 0) {
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
    const onCallStateChanged = omiEmitter.addListener(
      OmiCallEvent.onCallStateChanged,
      callStateChanged
    );
    omiEmitter.addListener(OmiCallEvent.onMuted, onMuted);
    omiEmitter.addListener(OmiCallEvent.onHold, onHold);
    omiEmitter.addListener(OmiCallEvent.onCallQuality, onCallQuality);
    omiEmitter.addListener(OmiCallEvent.onAudioChange, onAudioChange);
    omiEmitter.addListener(
      OmiCallEvent.onSwitchboardAnswer,
      onSwitchboardAnswer
    );

    omiEmitter.addListener(OmiCallEvent.onRequestPermissionAndroid, onReqPermission);

    LiveData.isOpenedCall = true;
    return () => {
      onCallStateChanged.remove();
      omiEmitter.removeAllListeners(OmiCallEvent.onAudioChange);
      omiEmitter.removeAllListeners(OmiCallEvent.onMuted);
      omiEmitter.removeAllListeners(OmiCallEvent.onHold);
      omiEmitter.removeAllListeners(OmiCallEvent.onCallQuality);
      omiEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
      omiEmitter.removeAllListeners(OmiCallEvent.onSwitchboardAnswer);
      omiEmitter.removeAllListeners(OmiCallEvent.onRequestPermissionAndroid);
      LiveData.isOpenedCall = false;
    };
  }, []);

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
        <View style={styles.feature}>
          {currentStatus == OmiCallState.confirmed  || currentStatus == OmiCallState.hold ? (
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
              </View>
            )
          ) : null}
        </View>
        <View style={styles.call}>
          <TouchableOpacity
            onPress={async () => {
              console.log('=>>>>>>>> end call  rejectCall =>>>>>>>>');
              // endCall();
              // navigation.goBack();
              rejectCall()
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
