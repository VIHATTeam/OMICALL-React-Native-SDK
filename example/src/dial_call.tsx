import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CustomTimer, KeyboardAvoid, UIColors } from './components';
import React, { useCallback, useEffect, useState } from 'react';
import {
  endCall,
  OmiCallEvent,
  omiEmitter,
  sendDTMF,
  toggleMute,
  toggleSpeak,
} from 'omikit-plugin';
import { UIImages } from '../assets';
import { useNavigation } from '@react-navigation/native';
import { CustomKeyboard } from './components/custom_view/custom_keyboard';

export const DialCallScreen = ({ route }: any) => {
  const callerNumber = route.params.callerNumber;
  const navigation = useNavigation();
  const [micOn, setMicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [keyboardOn, setKeyboardOn] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {}, []);

  const onCallEstablished = () => {
    console.log('onCallEstablished');
    setShowTimer(true);
  };

  const onCallEnd = useCallback(
    (data: any) => {
      console.log('onCallEnd');
      console.log(data);
      setShowTimer(false);
      navigation.goBack();
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
    return () => {
      omiEmitter.removeAllListeners(OmiCallEvent.onCallEstablished);
      omiEmitter.removeAllListeners(OmiCallEvent.onCallEnd);
      omiEmitter.removeAllListeners(OmiCallEvent.onMuted);
      omiEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
    };
  }, [onCallEnd, onMuted, onSpeaker]);

  return (
    <KeyboardAvoid>
      <View style={styles.background}>
        <Text style={styles.phone}>{callerNumber ?? ''}</Text>
        {showTimer ? (
          <CustomTimer />
        ) : (
          <Text style={styles.calling}>{'Calling...'}</Text>
        )}
        {keyboardOn ? (
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
                setKeyboardOn(true);
              }}
            >
              <Image source={UIImages.comment} style={styles.featureImage} />
            </TouchableOpacity>
            <TouchableOpacity onPress={triggerSpeak}>
              <Image
                source={micOn ? UIImages.audioOn : UIImages.audioOff}
                style={styles.featureImage}
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.call}>
          <TouchableOpacity
            onPress={async () => {
              await endCall();
            }}
          >
            <Image source={UIImages.hangup} style={styles.hangup} />
          </TouchableOpacity>
          {/* <TouchableOpacity
            onPress={async () => {
              await joinCall();
            }}
          >
            <Image source={UIImages.joinCall} style={styles.hangup} />
          </TouchableOpacity> */}
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
  calling: {
    fontSize: 20,
    color: UIColors.textColor,
    marginTop: 8,
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
});
