import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CustomTimer, KeyboardAvoid, UIColors } from './components';
import React, { useCallback, useEffect, useState } from 'react';
import { endCall, omiEmitter, toggleMute } from 'omikit-plugin';
import { UIImages } from './../assets';
import { useNavigation } from '@react-navigation/native';
import { CustomKeyboard } from './components/custom_view/custom_keyboard';

export const CallScreen = () => {
  const navigation = useNavigation();
  const [micOn, setMicOn] = useState(true);
  const [audioOn, setAudioOn] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [keyboardOn, setKeyboardOn] = useState(false);
  const [title, setTitle] = useState('');

  const incomingReceived = (data: any) => {
    console.log('incomingReceived');
    console.log(data);
  };

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

  const onMuted = (data: any) => {
    console.log('onMuted');
    console.log(data);
  };

  const onRinging = () => {
    console.log('onRinging');
  };

  const pressKeyCap = useCallback(
    (text: string) => {
      setTitle(title + text);
    },
    [title]
  );

  useEffect(() => {
    omiEmitter.addListener('incomingReceived', incomingReceived);
    omiEmitter.addListener('onCallEstablished', onCallEstablished);
    omiEmitter.addListener('onCallEnd', onCallEnd);
    omiEmitter.addListener('onMuted', onMuted);
    omiEmitter.addListener('onRinging', onRinging);
    return () => {
      omiEmitter.removeAllListeners('incomingReceived');
      omiEmitter.removeAllListeners('onCallEstablished');
      omiEmitter.removeAllListeners('onCallEnd');
      omiEmitter.removeAllListeners('onMuted');
      omiEmitter.removeAllListeners('onRinging');
    };
  }, [onCallEnd]);

  return (
    <KeyboardAvoid>
      <View style={styles.background}>
        <Text style={styles.phone}>{'Phone number'}</Text>
        {showTimer ? (
          <CustomTimer />
        ) : (
          <Text style={styles.calling}>{'Calling mobile...'}</Text>
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
            <TouchableOpacity
              onPress={() => {
                const newMic = !micOn;
                toggleMute();
                setMicOn(newMic);
              }}
            >
              <Image
                source={micOn ? UIImages.micOn : UIImages.micOff}
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
            <TouchableOpacity
              onPress={() => {
                setAudioOn(true);
              }}
            >
              <Image
                source={audioOn ? UIImages.audioOn : UIImages.audioOff}
                style={styles.featureImage}
              />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          onPress={async () => {
            await endCall();
          }}
        >
          <Image source={UIImages.hangup} style={styles.hangup} />
        </TouchableOpacity>
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
    marginBottom: 30,
  },
});
