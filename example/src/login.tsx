import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheet, TextInput, View, Linking, Alert} from 'react-native';

import { initCallWithUserPassword, getCurrentUser, logout} from 'omikit-plugin';

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
const REALM = 'namplh';
const USER_NAME = '100';
const PASS_WORD = 'aRCMrnPODG';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    requestNotification();
  }, []);

  const loginUser = async () => {
    console.log("*** Starting login process ***");
    console.log("Username:", userName);

    setLoading(true);
    const fcmToken = await token;
    console.log("FCM token:", fcmToken ? "Available" : "Not available");

    const loginInfo = {
      userName: userName,
      password: password,
      realm: realm,
      isVideo: isVideo,
      fcmToken: fcmToken,
      host: host,
      projectId: "omicrm-6558a"
    };
    
    try {
      console.log("Calling initCallWithUserPassword...");
      const result = await initCallWithUserPassword(loginInfo);
      console.log("Login result:", result);
      
      if (result) {
        console.log("Login successful, adding delay for Android...");
        // Thêm delay cho cả Android và iOS để đảm bảo quá trình đăng nhập hoàn tất
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log("Getting user info...");
        const infoUser = await getCurrentUser();
        console.log("User info:", infoUser);
        
        if (infoUser != null && Object.keys(infoUser || {}).length > 0) {
          console.log("Successfully got user info, saving to storage...");
          // Lưu cả thông tin đăng nhập và thông tin người dùng
          try {
            // Lưu thông tin đăng nhập vào localStorage
            await LocalStorage.setItem('login_data', JSON.stringify(loginInfo));
            console.log("Login data saved successfully");
            
            // Điều hướng đến màn hình Home
            console.log("Navigating to Home screen...");
            navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
          } catch (storageError) {
            console.error("Error saving login data:", storageError);
            Alert.alert('Lỗi lưu thông tin', 'Không thể lưu thông tin đăng nhập');
          }
        } else {
          console.error("User info is empty or null");
          logout();
          Alert.alert('Lỗi lấy thông tin', 'Không thể lấy thông tin người dùng');
        }
      } else {
        console.error("Login failed");
        logout();
        Alert.alert('Lỗi đăng nhập', 'Đăng nhập thất bại, vui lòng thử lại');
      }
    } catch (error) {
      console.error('Login error:', error);
      logout();
      Alert.alert('Lỗi đăng nhập', 'Đã xảy ra lỗi, vui lòng thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  

  const _videoTrigger = useCallback(() => {
    setIsVideo(!isVideo);
  }, [isVideo]);


  useEffect(() => {
    // Hàm xử lý khi nhận deeplink
    const handleDeepLink = (event: {url: string}) => {
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
