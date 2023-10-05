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
import { requestNotification , fcm} from './notification';
import { localStorage } from './local_storage';
import { Alert } from 'react-native';

export const LoginApiKeyScreen = () => {
  const [isVideo, setIsVideo] = useState(true);
  const [loading, setLoading] = useState(false);
  const phoneFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const passwordFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const realmFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const hostFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  var [fullName, setFullName] = useState(
    Platform.OS === 'android' ? 'chau4' : 'chau2'
  );
  var [usrUuid, setUsrUuid] = useState(
    Platform.OS === 'android' ? '124aaa' : '123aaa'
  );
  var apiKey = '';
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
    console.log(result);
    //save login info
    setLoading(false);
    if (result === true) {
      const loginInfoString = JSON.stringify(loginInfo);
      localStorage.set('login_info', loginInfoString);
      // navigation to home
      navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
    } else {
      showAlert('Login failed');
    }
  }, [usrUuid, fullName, navigation, isVideo, apiKey]);

  const _videoTrigger = useCallback(() => {
    setIsVideo(!isVideo);
  }, [isVideo]);

  const showAlert = (message: string) =>
    Alert.alert('Notification', message, [
      {
        text: 'Cancel',
      },
    ]);

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
              setUsrUuid(text);
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
              setFullName(text);
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
