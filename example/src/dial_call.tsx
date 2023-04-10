import {
  BackHandler,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CallStatus, CustomTimer, KeyboardAvoid, UIColors } from './components';
import React, { useCallback, useEffect, useState } from 'react';
import {
  endCall,
  OmiCallEvent,
  omiEmitter,
  sendDTMF,
  toggleMute,
  toggleSpeak,
  joinCall,
} from 'omikit-plugin';
import { UIImages } from '../assets';
import { useNavigation } from '@react-navigation/native';
import { CustomKeyboard } from './components/custom_view/custom_keyboard';
import { LiveData } from './livedata';

export const DialCallScreen = ({ route }: any) => {
  const callerNumber = route.params.callerNumber;
  const navigation = useNavigation();
  const [status, setStatus] = useState(route.params.status);
  const [micOn, setMicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [keyboardOn, setKeyboardOn] = useState(false);
  const [title, setTitle] = useState('');
  const [needBack, setNeedBack] = useState(true);

  const onCallEstablished = () => {
    console.log('onCallEstablished');
    setStatus(CallStatus.established);
  };

  const onCallEnd = useCallback(
    (data: any) => {
      setStatus(CallStatus.end);
      console.log('onCallEnd');
      console.log(data);
      if (needBack) {
        navigation.goBack();
      }
    },
    [navigation, needBack]
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
    toggleSpeak();
  }, []);

  const triggerMute = useCallback(() => {
    // setMicOn((prev) => !prev);
    toggleMute();
  }, []);

  useEffect(() => {
    omiEmitter.addListener(OmiCallEvent.onCallEstablished, onCallEstablished);
    omiEmitter.addListener(OmiCallEvent.onCallEnd, onCallEnd);
    omiEmitter.addListener(OmiCallEvent.onMuted, onMuted);
    omiEmitter.addListener(OmiCallEvent.onSpeaker, onSpeaker);
    LiveData.isOpenedCall = true;
    return () => {
      console.log('remove widget');
      omiEmitter.removeAllListeners(OmiCallEvent.onCallEstablished);
      omiEmitter.removeAllListeners(OmiCallEvent.onCallEnd);
      omiEmitter.removeAllListeners(OmiCallEvent.onMuted);
      omiEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
      LiveData.isOpenedCall = false;
    };
  }, [onCallEnd, onMuted, onSpeaker]);

  useEffect(() => {
    const onBackPress = () => {
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, []);

  return (
    <KeyboardAvoid>
      <View style={styles.background}>
        <Text style={styles.phone}>{callerNumber ?? ''}</Text>
        <View style={styles.title}>
          {status === CallStatus.established ? (
            <CustomTimer />
          ) : (
            <Text style={styles.status}>{status}</Text>
          )}
        </View>
        <View style={styles.feature}>
          {status === CallStatus.established ? (
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
          <TouchableOpacity
            onPress={async () => {
              setNeedBack(false);
              endCall();
              omiEmitter.removeAllListeners(OmiCallEvent.onCallEnd);
              navigation.goBack();
            }}
          >
            <Image source={UIImages.hangup} style={styles.hangup} />
          </TouchableOpacity>
          {status === CallStatus.ringing ? (
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
  phone: {
    fontSize: 30,
    color: UIColors.textColor,
    fontWeight: '700',
  },
  title: {
    marginTop: 16,
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
