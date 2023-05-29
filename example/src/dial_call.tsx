import {
  BackHandler,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomTimer, KeyboardAvoid, UIColors } from './components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  endCall,
  OmiCallEvent,
  omiEmitter,
  sendDTMF,
  toggleMute,
  toggleSpeaker,
  joinCall,
  getCurrentUser,
  getGuestUser,
  OmiCallState,
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
  const [micOn, setMicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [keyboardOn, setKeyboardOn] = useState(false);
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
      const { status, transactionId, callerNumber, isVideo } = data;
      console.log(transactionId);
      console.log(isVideo);
      console.log(status);
      console.log(callerNumber);
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

  const onSpeaker = useCallback((data: any) => {
    console.log('onSpeaker');
    // const isSpeaker = data.isSpeaker;
    console.log('is speaker ' + data);
    setMicOn(data);
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

  const triggerSpeak = useCallback(() => {
    toggleSpeaker();
  }, []);

  const triggerMute = useCallback(() => {
    // setMicOn((prev) => !prev);
    toggleMute();
  }, []);

  const onSwitchboardAnswer = useCallback(async (data: any) => {
    const { sip } = data;
    console.log(sip);
    console.log(sip);
    //use sip to get info getUserInfo()
    const guest = await getGuestUser();
    setGuestUser(guest);
  }, []);

  const onCallQuality = useCallback((data: any) => {
    const { quality } = data;
    console.log(quality);
  }, []);

  useEffect(() => {
    const onCallStateChanged = omiEmitter.addListener(
      OmiCallEvent.onCallStateChanged,
      callStateChanged
    );
    omiEmitter.addListener(OmiCallEvent.onMuted, onMuted);
    omiEmitter.addListener(OmiCallEvent.onSpeaker, onSpeaker);
    omiEmitter.addListener(OmiCallEvent.onCallQuality, onCallQuality);
    omiEmitter.addListener(
      OmiCallEvent.onSwitchboardAnswer,
      onSwitchboardAnswer
    );
    LiveData.isOpenedCall = true;
    return () => {
      onCallStateChanged.remove();
      omiEmitter.removeAllListeners(OmiCallEvent.onMuted);
      omiEmitter.removeAllListeners(OmiCallEvent.onCallQuality);
      omiEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
      omiEmitter.removeAllListeners(OmiCallEvent.onSwitchboardAnswer);
      LiveData.isOpenedCall = false;
    };
  }, [
    callStateChanged,
    onMuted,
    onSpeaker,
    onSwitchboardAnswer,
    onCallQuality,
  ]);

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
        <View style={styles.title}>
          {currentStatus === OmiCallState.confirmed ? (
            <CustomTimer />
          ) : (
            <Text style={styles.status}>{currentStatusText}</Text>
          )}
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
                <TouchableOpacity onPress={triggerSpeak}>
                  <Image
                    source={micOn ? UIImages.audioOn : UIImages.audioOff}
                    style={styles.featureImage}
                  />
                </TouchableOpacity>
              </View>
            )
          ) : null}
        </View>
        <View style={styles.call}>
          {currentStatus > OmiCallState.calling ? (
            <TouchableOpacity
              onPress={async () => {
                endCall();
                navigation.goBack();
              }}
            >
              <Image source={UIImages.hangup} style={styles.hangup} />
            </TouchableOpacity>
          ) : null}
          {currentStatus === OmiCallState.incoming ||
          (currentStatus === OmiCallState.early && isOutGoingCall === false) ? (
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
