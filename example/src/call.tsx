import { StyleSheet, View } from 'react-native';
import { KeyboardAvoid } from './components';
import React, { useEffect } from 'react';
import { omiEmitter } from 'omikit-plugin';

export const CallScreen = () => {
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
  }, []);

  const incomingReceived = (data: any) => {
    console.log('incomingReceived');
    console.log(data);
  };

  const onCallEstablished = () => {
    console.log('onCallEstablished');
  };

  const onCallEnd = (data: any) => {
    console.log('onCallEnd');
    console.log(data);
  };

  const onMuted = (data: any) => {
    console.log('onMuted');
    console.log(data);
  };

  const onRinging = () => {
    console.log('onRinging');
  };

  return (
    <KeyboardAvoid>
      <View style={styles.background}></View>
    </KeyboardAvoid>
  );
};

const styles = StyleSheet.create({
  background: {},
});
