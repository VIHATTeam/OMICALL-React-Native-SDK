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
} from 'omikit-plugin';
import { UIImages } from '../assets';
import { useNavigation } from '@react-navigation/native';
import { CustomKeyboard } from './components/custom_view/custom_keyboard';
import { LiveData } from './livedata';
import { UserView } from './components/custom_view/user_view';

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
  const currentStatusText = useMemo(
    () => getDescriptionFromStatus(currentStatus),
    [currentStatus]
  );

  function getDescriptionFromStatus(status: number) {
    if (status === OmiCallState.calling) {
      return 'Đang kết nối tới cuộc gọi';
    }
    if (status === OmiCallState.connecting) {
      return 'Đang kết nối';
    }
    if (status === OmiCallState.early) {
      return 'Cuộc gọi đang đổ chuông';
    }
    if (status === OmiCallState.confirmed) {
      return 'Cuộc gọi bắt đầu';
    }
    if (status === OmiCallState.disconnected) {
      return 'Cuộc gọi kết thúc';
    }
    return '';
  }

  const callStateChanged = useCallback(
    (data: any) => {
      const { status } = data;
      setCurrentStatus(status);
      if (status === OmiCallState.disconnected) {
        navigation.goBack();
      }
    },
    [navigation]
  );

  const onMuted = useCallback((data: any) => {
    console.log('onMuted');
    // const isMuted = data.isMuted;
    console.log('is muted ' + data);
    setMuted(data);
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

  const triggerMute = useCallback(() => {
    // setMicOn((prev) => !prev);
    toggleMute();
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
    console.log(data);
    const { name } = data[0];
    setCurrentAudio(name);
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

  useEffect(() => {
    const onCallStateChanged = omiEmitter.addListener(
      OmiCallEvent.onCallStateChanged,
      callStateChanged
    );
    omiEmitter.addListener(OmiCallEvent.onMuted, onMuted);
    omiEmitter.addListener(OmiCallEvent.onCallQuality, onCallQuality);
    omiEmitter.addListener(OmiCallEvent.onAudioChange, onAudioChange);
    omiEmitter.addListener(
      OmiCallEvent.onSwitchboardAnswer,
      onSwitchboardAnswer
    );
    LiveData.isOpenedCall = true;
    return () => {
      onCallStateChanged.remove();
      omiEmitter.removeAllListeners(OmiCallEvent.onAudioChange);
      omiEmitter.removeAllListeners(OmiCallEvent.onMuted);
      omiEmitter.removeAllListeners(OmiCallEvent.onCallQuality);
      omiEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
      omiEmitter.removeAllListeners(OmiCallEvent.onSwitchboardAnswer);
      LiveData.isOpenedCall = false;
    };
  }, [
    callStateChanged,
    onMuted,
    onSwitchboardAnswer,
    onCallQuality,
    onAudioChange,
  ]);

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
          {currentStatus === OmiCallState.confirmed ? <CustomTimer /> : null}
        </View>
        <View style={styles.feature}>
          {currentStatus === OmiCallState.confirmed ? (
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
                <TouchableOpacity onPress={triggerMute}>
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
                {/* <TouchableOpacity onPress={triggerSpeak}>
                  <Image
                    source={micOn ? UIImages.audioOn : UIImages.audioOff}
                    style={styles.featureImage}
                  />
                </TouchableOpacity> */}
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
              endCall();
              navigation.goBack();
            }}
          >
            <Image source={UIImages.hangup} style={styles.hangup} />
          </TouchableOpacity>
          {(currentStatus === OmiCallState.incoming ||
            currentStatus === OmiCallState.early) &&
          isOutGoingCall === false ? (
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
