import { useNavigation } from '@react-navigation/native';
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheet, TextInput, View, Linking } from 'react-native';

import { initCallWithUserPassword, getCurrentUser} from 'omikit-plugin';

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
const REALM = 'dathq';
const USER_NAME = '121';
const PASS_WORD = '1jJKD4Ps6X';

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

    // const loginInfo = {
    //   userName: userName,
    //   password: password,
    //   realm: realm,
    //   isVideo: isVideo,
    //   fcmToken: fcmToken,
    //   host: host,
    //   projectId: ""
    // };

    const loginInfo = {
      userName: "101",
      password: "Duongngocqui@98",
      realm: "quidn",
      isVideo: isVideo,
      fcmToken: fcmToken,
      host: host,
        projectId: "omicrm-6558a"
    };
    const result11 = await getCurrentUser()

    console.log('result initCallWithUserPassword: ', result11);


    // const loginInfo = {
    //     userName: "100",
    //     password: "Z5N6IGNa8s",
    //     realm: "truongphannguyenan",
    //     isVideo: isVideo,
    //     fcmToken: fcmToken,
    //     host: host,
    //     projectId: "omicrm-6558a"
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
      const result2 = await getCurrentUser()
      console.log("result2 22 --> ", result2)
      const loginInfoString = JSON.stringify(loginInfo);
      LocalStorage.set('login_info', loginInfoString);
      // navigation to home
      navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
    }
  };

  const _videoTrigger = useCallback(() => {
    setIsVideo(!isVideo);
  }, [isVideo]);


  useEffect(() => {
    // Hàm xử lý khi nhận deeplink
    const handleDeepLink = (event) => {
      const url = event.url;
      // Xử lý URL ở đây
      console.log('Received deep link: ', url);
      // Ví dụ: Điều hướng đến một màn hình cụ thể
    };

    // Lấy URL nếu ứng dụng được mở từ trạng thái bị tắt hoàn toàn
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          // Xử lý URL ở đây
          console.log('App opened with URL: ', url);
        }
      })
      .catch((err) => console.error('An error occurred', err));

    // Lắng nghe sự kiện URL
    Linking.addEventListener('url', handleDeepLink);

  
  }, []);


  const openCallWithOMI = async () => {
    try {
      // let omiLink = "omicall-call:0346066476&param1=123456789"
      let omiLink = "omicall-call:0346066476&deeplink=tasetco-delivery&param1=MKP-KH19-000028&param2=ITVINATESTTONGDAI1"
      const canOpen = await Linking.canOpenURL(omiLink);
      if (canOpen) {
        await Linking.openURL(omiLink);
      } else {
        console.log("Cannot open URL: $omiLink");
      }
    } catch (error) {
      console.error("An error occurred while trying to open the URL:", error);
    }
  };

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


          <CustomButton
            title="Test Universal"
            callback={() => {
              openCallWithOMI();
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
