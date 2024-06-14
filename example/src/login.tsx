import { useNavigation } from '@react-navigation/native';
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { initCallWithUserPassword } from 'omikit-plugin';

import LocalStorage from './local_storage';
import { requestNotification, token } from './notification';

import {
  CustomButton,
  CustomCheckBox,
  CustomTextField,
  KeyboardAvoid,
} from './components';
import { CustomLoading } from './components/custom_view/custom_loading';

// HUNGTH
const REALM = 'quidn';
const USER_NAME = '102';
const PASS_WORD = 'Duongngocqui@98';

export const LoginScreen = () => {
  const [isVideo, setIsVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const phoneFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const passwordFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const realmFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const hostFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const [userName, setUserNumber] = useState(USER_NAME);
  const [password, setPassword] = useState(PASS_WORD);
  const [realm, setRealm] = useState(REALM);
  const [host, setHost] = useState('vh.omicrm.com');
  const navigation = useNavigation();

  useEffect(() => {
    requestNotification();
  }, []);

  const loginUser = async () => {
    console.log(userName);
    console.log(password);

    setLoading(true);
    const fcmToken = await token;
    console.log(fcmToken);

    const loginInfo = {
      userName: userName,
      password: password,
      realm: realm,
      isVideo: isVideo,
      fcmToken: fcmToken,
      host: host,
    };

    // const loginInfo = {
    //   userName: "102",
    //   password: "OzF2aaCEqk",
    //   realm: "dathq",
    //   isVideo: isVideo,
    //   fcmToken: fcmToken,
    //   host: host,
    // };

    // const loginInfo = {
    //     userName: "100",
    //     password: "Duongngocqui@98",
    //     realm: "quidn",
    //     isVideo: isVideo,
    //     fcmToken: fcmToken,
    //     host: host,
    // };

    //  const loginInfoApiKey = {
    //   fullName: "thanh mơis",
    //   usrUuid: "0358380646",
    //   apiKey: "E7AF81703203FC31F5658FAF3B875149CD57368ED07DB4AF414D93D3D2EBC76E",
    //   isVideo: false,
    //   phone: "0358380646",
    //   fcmToken: fcmToken
    // };

    //  const loginInfoApiKey = {
    //   usrUuid:"094d4f52-255c-4cdb-ad24-5adff34c3c87",
    //   fullName:"Lê Hồng Thái",
    //   apiKey:"687CB3BF9703A7F434964CC64EE72213962AB18812D7EB2FC9C83B89D917E6",
    //   isVideo: true,
    //   phone: "0963256096",
    //   fcmToken: fcmToken
    // };

    // console.log("loginInfo ", loginInfo);

    const result = await initCallWithUserPassword(loginInfo);
    // const result = await initCallWithApiKey(loginInfoApiKey);
    //save login info

    console.log('result initCallWithUserPassword: ', result);

    setLoading(false);
    if (result) {
      const loginInfoString = JSON.stringify(loginInfo);
      LocalStorage.set('login_info', loginInfoString);
      // navigation to home
      navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
    }
  };

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
            label="User name"
            returnKey={'next'}
            currentFocus={phoneFocus}
            nextFocus={passwordFocus}
            onChange={(text: string) => {
              setUserNumber(text);
            }}
          />
          <CustomTextField
            placeHolder="Password"
            label="Password"
            style={styles.passwordInput}
            value={password}
            isPassword={false}
            currentFocus={passwordFocus}
            nextFocus={realmFocus}
            onChange={(text: string) => {
              setPassword(text);
            }}
          />
          <CustomTextField
            placeHolder="Realm"
            label="Realm"
            style={styles.passwordInput}
            value={realm}
            isPassword={false}
            currentFocus={realmFocus}
            nextFocus={hostFocus}
            onChange={(text: string) => {
              setRealm(text);
            }}
          />
          <CustomTextField
            label="Host"
            placeHolder="vh.omicrm.com"
            style={styles.passwordInput}
            value={host}
            isPassword={false}
            currentFocus={hostFocus}
            onChange={(text: string) => {
              setHost(text);
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
            callback={() => {
              loginUser();
            }}
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
