import { StyleSheet, TextInput, View } from 'react-native';
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  CustomButton,
  CustomCheckBox,
  CustomTextField,
  KeyboardAvoid,
} from './components';
import { initCall } from 'omikit-plugin';
// import { requestNotification } from './notification';
import { useNavigation } from '@react-navigation/native';
import { CustomLoading } from './components/custom_view/custom_loading';

export const LoginScreen = () => {
  const [isVideo, setIsVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const phoneFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const passwordFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  var userName = '100';
  var password = 'ConCung100';
  const navigation = useNavigation();

  useEffect(() => {
    requestNotification();
  }, []);

  const updateTokenCallback = useCallback(async () => {
    console.log(userName);
    console.log(password);
    setLoading(true);
    const result = await initCall({
      userName: userName,
      password: password,
      realm: 'thaonguyennguyen1197',
    });
    setLoading(false);
    if (result) {
      //navigation to home
      navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
    }
  }, [password, userName, navigation]);

  const _videoTrigger = useCallback(() => {
    setIsVideo(!isVideo);
  }, [isVideo]);

  return (
    <>
      <KeyboardAvoid>
        <View style={styles.background}>
          <CustomTextField
            placeHolder="User name"
            // keyboardType="phone-pad"
            value={userName}
            returnKey={'next'}
            currentFocus={phoneFocus}
            nextFocus={passwordFocus}
            onChange={(text: string) => {
              userName = text;
            }}
          />
          <CustomTextField
            placeHolder="Password"
            style={styles.passwordInput}
            value={password}
            isPassword={true}
            currentFocus={passwordFocus}
            onChange={(text: string) => {
              password = text;
            }}
          />
          <CustomCheckBox
            title="Video call"
            checked={isVideo}
            callback={_videoTrigger}
            style={styles.checkbox}
          />
          <CustomButton
            title="Login"
            callback={updateTokenCallback}
            style={styles.button}
          />
          {loading ? <CustomLoading /> : null}
        </View>
      </KeyboardAvoid>
    </>
  );
};

const styles = StyleSheet.create({
  background: {
    padding: 24,
    flex: 1,
  },
  passwordInput: {
    marginTop: 16,
  },
  button: {
    marginTop: 24,
  },
  checkbox: {
    marginTop: 24,
  },
  lottie: {
    width: 100,
    height: 100,
  },
});
