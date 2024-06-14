# Changelog

All notable changes to this project will be documented in this file.

## 3.2.34
- Update OMI core IOS to version 1.7.23
- Update OMI core Android to version 2.2.80
- Fix accept call second for ios
- Improve start call for ios
- Improve FCM for android
- Update new format FCM for android

## 3.2.33
- Update OMI core IOS to version 1.7.17
- Fix call_id off func joinCall

## 3.2.32
- Update OMI core android to version 2.2.42
- Update BroadcastReceiver for Android 14+

## 3.2.31
- Update android maven config


## 3.2.30
- Remove glide android 


## 3.2.29
- Update OMI core android to version 2.2.41
- Remove dependencies glide in Android

## 3.2.28
- Update OMI core android to version 1.7.16

## 3.2.27
- Update OMI core android to version 2.2.40


## 3.2.26
- Update OMI core ios to version 1.7.15
- Fix callkit bug when forwarding multiple times back to self
- Update OMI core android to version 2.2.35
- Improved long call quality for android

## 3.2.25
- Update OMI core ios to version 1.6.38
- Fix missing transactionID 

## 3.2.24
- Update OMI core android to version 2.1.46
- Fix error ARN in android 


## 3.2.23
- Update OMI core android to version 2.1.45
- Update OMI core IOS to version 1.6.37
- Fix error of not being able to turn off notifications when making a call and then killing the app.
- Add log information call, you can easy see quality call in web. 

## 3.2.22
- Update core android to version 2.1.27
- Update ios to version 1.6.34
- Update audio and call quality off Android.
- Fix connection errors related to NAT in Android/iOS.
- Fix crash error related to NAT in iOS


## 3.2.21

- Update Readme
- Add field 'code_end_call' for get code end call 

## 3.2.20

- Pump core android 2.0.80
- Pump core ios 1.6.14

## 3.2.19

- Pump core android

## 3.2.18

- Turn on Log Debug

## 3.2.16

- Turn on Log Debug

## 3.2.15
  - Pump core android
  - Remove function updateToken
  - Prevent registering account multiple times
  - Add params token in fnc register

## 3.2.14
  - Pump core android
  - Add delay check get call info 


## 3.2.12
  - Pump core android

## 3.2.11
  - Pump core android

## 3.2.10
  - Pump core android

## 3.2.9
  - Pump core android

## 3.2.8
  - Pump core android

## 3.2.7
  - Pump core android

## 3.2.6
  - Pump core android

## 3.2.5
  - Pump core android


## 3.2.2
  - Pump core android
  - Add more logs call 

## 3.2.1
  - Pump core android
  - Add more logs call 

## 3.2.0
  - Pump core android
  - Add more logs call 

## 3.1.9
  - Pump core android

## 3.1.8
  - Pump core android


## 3.1.7
  - Pump core android


## 3.1.6
  - Pump core android
  - Pump core ios

## 3.1.5
  - Pump core android
  - Optimize Android performance

## 3.1.4
  - Pump core android
  - Fix issues first call with wifi of android

## 3.1.2
  - Pump core android
  - Fix issues call outgoing with wifi in android

## 3.1.0
  - Pump core android
  - Pump core ios
  - Fix issues call outgoing with wifi in android

## 3.0.9
  - Pump core android
  - Add transfer call android 

## 3.0.8
  - Pump core ios
  - Fix status call ios when endcall

## 3.0.6
  - Pump core android
  - Add function transferCall 

## 3.0.5
  - Fix bug android join call with end call 


## 3.0.4
  - Fix missing file ios



  ## 3.0.3
  - Increase android core
  - Increase android ios
  - Update State call


## 3.0.2
  - Increase android core
  - Increase android ios
  - Update State call 

## 3.0.1
  - Increase android core
  - Update new readme
  - Update sample

## 3.0.0
- **BREAKING CHANGE**
  - Increase android/core core
  - We support lifecycle for calling
  - Support cancel a call 
  - Return `startCallStatus`
  - Update sample

## 2.4.0
- **BREAKING CHANGE**
  - Increase android/core core
  - Support Swift document
  - Support to return `outgoing`, `ringing`, `connecting`, `calling` status
  - Fix null point on release mode Android
  - Improve performance
  - Update sample

## 2.3.4
  - Increase android/iOS core
  - Support to custom channel id
  - Return call quality
  - Update sample

## 2.3.3
  - Increase android core
  - Add `systemAlertWindow`, `openSystemAlertSetting` to check system alert window permission
  - Update sample

## 2.3.2
  - Increase android core
  - Improve background and kill app state
  - Update sample

## 2.3.1
  - Increase android core
  - Improve setup camera
  - Update sample

## 2.3.0
  - Increase android/iOS core
  - Support to receive switchboard
  - Update sample

## 2.2.3
  - Increase android core
  - Allow to set image for the incoming notification
  - Update sample

## 2.2.2
  - Increase android/ ios core
  - Support to change notification icon on Android
  - Update sample

## 2.2.1
  - Update readme

## 2.2.0
  - Increase Android/iOS core version
  - Replace `FMService` to `FirebaseMessageReceiver` in AndroidManifest.xml
  - Support missed call
  - Return call information after the call ending.
  - Add `getCurrentUser`, `getGuestUser` and `getUserInfo` to get user information.
  - Update document and sample
  
## 2.1.2
  - Fix crash when startCall on Android

## 2.1.1
  - Increase Android/iOS core version
  - Add `registerVideoEvent` to register remote video ready.
  - Update document and sample

## 2.1.0
  - Increase Android/iOS core version
  - Add `logout` function
  - Remove appId and deviceId in `updateToken`
  - Update sample
