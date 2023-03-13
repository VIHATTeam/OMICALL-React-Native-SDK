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
import { requestNotification } from './notification';
import { localStorage } from './local_storage';

export const LoginScreen = () => {
  const [isVideo, setIsVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const phoneFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const passwordFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const realmFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  var userName = '101';
  var password = 'Kunkun12345';
  var realm = 'dky';
  const navigation = useNavigation();

  useEffect(() => {
    requestNotification();
  }, []);

  const loginUser = useCallback(async () => {
    console.log(userName);
    console.log(password);
    setLoading(true);
    const loginInfo = {
      userName: userName,
      password: password,
      realm: realm,
      isVideo: isVideo,
    };
    console.log(loginInfo);
    const result = await initCall(loginInfo);
    //save login info
    setTimeout(async () => {
      setLoading(false);
      if (result) {
        const loginInfoString = JSON.stringify(loginInfo);
        localStorage.set('login_info', loginInfoString);
        // navigation to home
        navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
      }
    }, 2000);
  }, [password, userName, navigation, realm, isVideo]);

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
          <CustomTextField
            placeHolder="Realm"
            style={styles.passwordInput}
            value={realm}
            isPassword={true}
            currentFocus={realmFocus}
            onChange={(text: string) => {
              realm = text;
            }}
          />
          <CustomCheckBox
            title="Video call"
            checked={isVideo}
            callback={_videoTrigger}
            style={styles.checkbox}
          />
          <CustomButton
            title="LOGIN"
            callback={loginUser}
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
