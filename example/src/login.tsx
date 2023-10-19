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
import { initCallWithApiKey, initCallWithUserPassword } from 'omikit-plugin';
// import { requestNotification } from './notification';
import { useNavigation } from '@react-navigation/native';
import { CustomLoading } from './components/custom_view/custom_loading';
import { requestNotification , fcm} from './notification';
import { localStorage } from './local_storage';

export const LoginScreen = () => {
  const [isVideo, setIsVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const phoneFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const passwordFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const realmFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const hostFocus = useRef<TextInput>() as MutableRefObject<TextInput>;
  const [userName, setUserNumber] = useState(
    Platform.OS === 'android' ? '101' : '101'
  );
  const [password, setPassword] = useState(
    Platform.OS === 'android' ? 'M1zx7YyK30' : 'M1zx7YyK30'
  );
  const [realm, setRealm] = useState('hungth12');
  const [host, setHost] = useState('vh.omicrm.com');
  const navigation = useNavigation();

  useEffect(() => {
    requestNotification();
  }, []);

  const loginUser = async() => {

    console.log(userName);
    console.log(password);

    setLoading(true);
    const fcmToken = await fcm;
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
    //   userName: "103",
    //   password: "Bao99@9999",
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
    
    console.log("result initCallWithUserPassword: ", result);

    setLoading(false);
    if (result) {
      const loginInfoString = JSON.stringify(loginInfo);
      localStorage.set('login_info', loginInfoString);
      // navigation to home
      navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
    }
  }

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
              setUserNumber(text);
            }}
          />
          <CustomTextField
            placeHolder="Password"
            style={styles.passwordInput}
            value={password}
            isPassword={true}
            currentFocus={passwordFocus}
            nextFocus={realmFocus}
            onChange={(text: string) => {
              setPassword(text);
            }}
          />
          <CustomTextField
            placeHolder="Realm"
            style={styles.passwordInput}
            value={host}
            isPassword={true}
            currentFocus={realmFocus}
            nextFocus={hostFocus}
            onChange={(text: string) => {
              setRealm(text);
            }}
          />
          <CustomTextField
            placeHolder="Host"
            style={styles.passwordInput}
            value={realm}
            isPassword={true}
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
            callback={() =>{loginUser()}}
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
