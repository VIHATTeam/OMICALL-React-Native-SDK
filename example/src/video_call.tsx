import { Image, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { CallStatus, KeyboardAvoid } from './components';
import { useNavigation } from '@react-navigation/native';
import {
  OmiLocalCameraView,
  OmiCallEvent,
  omiEmitter,
  refreshLocalCamera,
  OmiRemoteCameraView,
  refreshRemoteCamera,
  toggleMute,
  toggleSpeaker,
  joinCall,
  endCall,
  registerVideoEvent,
  removeVideoEvent,
} from 'omikit-plugin';
import { LiveData } from './livedata';
import { BackHandler } from 'react-native';
import { UIImages } from '../assets';
import { Platform } from 'react-native';

export const VideoCallScreen = ({ route }: any) => {
  // const callerNumber = route.params.callerNumber;
  const navigation = useNavigation();
  const [status, setStatus] = useState(route.params.status);
  const [micOn, setMicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  // const [title, setTitle] = useState('');
  const [needBack, setNeedBack] = useState(true);

  const onCallEstablished = () => {
    console.log('onCallEstablished');
    if (Platform.OS === 'android') {
      refreshLocalCamera();
      refreshRemoteCamera();
    }
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

  const triggerSpeak = useCallback(() => {
    toggleSpeaker();
  }, []);

  const refreshLocalCameraEvent = useCallback(() => {
    // setMicOn((prev) => !prev);
    refreshLocalCamera();
  }, []);

  const refreshRemoteCameraEvent = useCallback(() => {
    // setMicOn((prev) => !prev);
    refreshRemoteCamera();
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
    if (Platform.OS === 'ios') {
      registerVideoEvent();
      omiEmitter.addListener(
        OmiCallEvent.onLocalVideoReady,
        refreshLocalCameraEvent
      );
      omiEmitter.addListener(
        OmiCallEvent.onRemoteVideoReady,
        refreshRemoteCameraEvent
      );
    }
    LiveData.isOpenedCall = true;
    return () => {
      console.log('remove widget');
      omiEmitter.removeAllListeners(OmiCallEvent.onCallEstablished);
      omiEmitter.removeAllListeners(OmiCallEvent.onCallEnd);
      omiEmitter.removeAllListeners(OmiCallEvent.onMuted);
      omiEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
      if (Platform.OS === 'ios') {
        removeVideoEvent();
        omiEmitter.removeAllListeners(OmiCallEvent.onLocalVideoReady);
        omiEmitter.removeAllListeners(OmiCallEvent.onRemoteVideoReady);
      }
      LiveData.isOpenedCall = false;
    };
  }, [
    onCallEnd,
    onMuted,
    onSpeaker,
    refreshLocalCameraEvent,
    refreshRemoteCameraEvent,
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

  return (
    <KeyboardAvoid>
      <View style={styles.background}>
        <OmiRemoteCameraView style={styles.remoteCamera} />
        <OmiLocalCameraView style={styles.localCamera} />
        <View style={styles.call}>
          {status === CallStatus.established ? (
            <TouchableOpacity onPress={triggerMute}>
              <Image
                source={!muted ? UIImages.micOn : UIImages.micOff}
                style={styles.hangup}
              />
            </TouchableOpacity>
          ) : null}
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
          {status === CallStatus.established ? (
            <TouchableOpacity onPress={triggerSpeak}>
              <Image
                source={micOn ? UIImages.audioOn : UIImages.audioOff}
                style={styles.hangup}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </KeyboardAvoid>
  );
};

const styles = StyleSheet.create({
  background: {
    width: '100%',
    height: '100%',
  },
  remoteCamera: {
    flex: 1,
  },
  localCamera: {
    position: 'absolute',
    top: 32,
    right: 16,
    width: 120,
    height: 200,
  },
  body: {},
  call: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    bottom: 30,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  hangup: {
    width: 60,
    height: 60,
  },
});
