import { StyleSheet, TextInput, View, Platform } from 'react-native';
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
import { initCallWithApiKey } from 'omikit-plugin';
// import { requestNotification } from './notification';
import { useNavigation } from '@react-navigation/native';
import { CustomLoading } from './components/custom_view/custom_loading';
import { requestNotification } from './notification';
import { localStorage } from './local_storage';

export const LoginApiKeyScreen = () => {
  const [isVideo, setIsVideo] = useState(true);
  const [loading, setLoading] = useState(false);
  const phoneFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const passwordFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const realmFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const hostFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  var usrUuid = Platform.OS === 'android' ? '122aaa' : '123aaa';
  var fullName = Platform.OS === 'android' ? 'chau1' : 'chau2';
  var apiKey =
    '0ACE08B2F03BE1D6B3F7F5CCD34D9AC08CB92976E2AB6CEE6EA38C5C96F1B858';
  const navigation = useNavigation();

  useEffect(() => {
    requestNotification();
  }, []);

  const loginUser = useCallback(async () => {
    console.log(usrUuid);
    console.log(fullName);
    setLoading(true);
    const loginInfo = {
      usrUuid: usrUuid,
      fullName: fullName,
      apiKey: apiKey,
      isVideo: isVideo,
    };
    console.log(loginInfo);
    const result = await initCallWithApiKey(loginInfo);
    //save login info
    setLoading(false);
    if (result) {
      const loginInfoString = JSON.stringify(loginInfo);
      localStorage.set('login_info', loginInfoString);
      // navigation to home
      navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
    }
  }, [usrUuid, fullName, navigation, isVideo, apiKey]);

  const _videoTrigger = useCallback(() => {
    setIsVideo(!isVideo);
  }, [isVideo]);

  return (
    <>
      <KeyboardAvoid>
        <View style={styles.background}>
          <CustomTextField
            placeHolder="User Uuid"
            // keyboardType="phone-pad"
            value={usrUuid}
            returnKey={'next'}
            currentFocus={phoneFocus}
            nextFocus={passwordFocus}
            onChange={(text: string) => {
              usrUuid = text;
            }}
          />
          <CustomTextField
            placeHolder="Fullname"
            style={styles.passwordInput}
            value={fullName}
            isPassword={true}
            currentFocus={passwordFocus}
            nextFocus={realmFocus}
            onChange={(text: string) => {
              fullName = text;
            }}
          />
          <CustomTextField
            placeHolder="Apikey"
            style={styles.passwordInput}
            value={apiKey}
            isPassword={true}
            currentFocus={realmFocus}
            nextFocus={hostFocus}
            onChange={(text: string) => {
              apiKey = text;
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
