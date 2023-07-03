import { Image, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { KeyboardAvoid } from './components';
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
  OmiCallState,
} from 'omikit-plugin';
import { LiveData } from './livedata';
import { BackHandler } from 'react-native';
import { UIImages } from '../assets';
import { Platform } from 'react-native';

export const VideoCallScreen = ({ route }: any) => {
  // const callerNumber = route.params.callerNumber;
  const navigation = useNavigation();
  const [currentStatus, setCurrentStatus] = useState(route.params.status);
  const [micOn, setMicOn] = useState(false);
  const [muted, setMuted] = useState(false);

  const callStateChanged = useCallback(
    (data: any) => {
      console.log('onCallEstablished');
      const { status, transactionId, callerNumber, isVideo } = data;
      console.log(transactionId);
      console.log(isVideo);
      console.log(callerNumber);
      setCurrentStatus(status);
      if (status === OmiCallState.confirmed) {
        if (Platform.OS === 'android') {
          refreshRemoteCamera();
          refreshLocalCamera();
        }
        return;
      }
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

  const triggerSpeak = useCallback(() => {
    toggleSpeaker();
  }, []);

  const refreshRemoteCameraEvent = useCallback(() => {
    // setMicOn((prev) => !prev);
    refreshRemoteCamera();
    refreshLocalCamera();
  }, []);

  const triggerMute = useCallback(() => {
    // setMicOn((prev) => !prev);
    toggleMute();
  }, []);

  useEffect(() => {
    const onCallStateChanged = omiEmitter.addListener(
      OmiCallEvent.onCallStateChanged,
      callStateChanged
    );
    omiEmitter.addListener(OmiCallEvent.onMuted, onMuted);
    omiEmitter.addListener(OmiCallEvent.onSpeaker, onSpeaker);
    if (Platform.OS === 'ios') {
      registerVideoEvent();
      omiEmitter.addListener(
        OmiCallEvent.onRemoteVideoReady,
        refreshRemoteCameraEvent
      );
    }
    LiveData.isOpenedCall = true;
    return () => {
      onCallStateChanged.remove();
      omiEmitter.removeAllListeners(OmiCallEvent.onMuted);
      omiEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
      if (Platform.OS === 'ios') {
        removeVideoEvent();
        omiEmitter.removeAllListeners(OmiCallEvent.onRemoteVideoReady);
      }
      LiveData.isOpenedCall = false;
    };
  }, [callStateChanged, onMuted, onSpeaker, refreshRemoteCameraEvent]);

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
          {currentStatus === OmiCallState.confirmed ? (
            <TouchableOpacity onPress={triggerMute}>
              <Image
                source={!muted ? UIImages.micOn : UIImages.micOff}
                style={styles.hangup}
              />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={async () => {
              endCall();
              navigation.goBack();
            }}
          >
            <Image source={UIImages.hangup} style={styles.hangup} />
          </TouchableOpacity>
          {currentStatus === OmiCallState.calling ? (
            <TouchableOpacity
              onPress={async () => {
                await joinCall();
              }}
            >
              <Image source={UIImages.joinCall} style={styles.hangup} />
            </TouchableOpacity>
          ) : null}
          {currentStatus === OmiCallState.confirmed ? (
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
