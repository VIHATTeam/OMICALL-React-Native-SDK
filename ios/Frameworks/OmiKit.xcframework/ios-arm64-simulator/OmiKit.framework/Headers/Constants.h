//
//  Constants.h
//  Copyright © 2016 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>

extern int const ddLogLevel;

#pragma PUSH
static NSString * KEY_OMI_VOIP_TOKEN = @"omicall/voipToken";
static NSString * KEY_OMI_DEVICE_TOKEN = @"omicall/device_token";
static NSString * KEY_OMI_MAX_CALL = @"omicall/max_call";
static NSString * KEY_OMI_CALLKIT_IMAGE = @"omicall/callkit_image";
static NSString * KEY_OMI_RECEIVE_APNS_TOKEN = @"KEY_OMI_RECEIVE_APNS_TOKEN";
static NSString * KEY_OMI_APP_ENVIROMENT = @"KEY_OMI_APP_ENVIROMENT";
static NSString * KEY_OMI_TYPE_PUSH_CALLKIT = @"omicall/type_push_callkit";
static NSString * KEY_OMI_PROJECT_FCM_ID = @"omicall/project_fcm_id";
static NSString * TYPE_PUSH_CALLKIT_FORGROUND = @"callkit/forground";
static NSString * TYPE_PUSH_CALLKIT_BACKGROUND =  @"callkit/background";
static NSString * TYPE_PUSH_CALLKIT_DEFAULT = @"callkit/default";
static NSString * PROJECT_ID_DEFAULT = @"omicrm-6558a";
static NSString * CALL_KIT = @"callkit/";

#pragma APP
static NSString * OMI_SIP_USER_LOGIN = @"omicall/user/login";
static NSString * KEY_OMI_APP_ENVIROMENT_PRODUCTION = @"1";
static NSString * KEY_OMI_APP_ENVIROMENT_SANDBOX = @"2";
static NSInteger KEY_OMI_APP_DEVICE_TYPE_IOS = 2;
static NSString * KEY_OMI_APP_DEVICE_TYPE_ANDROID = @"1";
static NSString * KEY_OMI_APP_USE_NOISE_SUPPRESSION = @"KEY_OMI_APP_USE_NOISE_SUPPRESSION";
static NSString * KEY_LOG_LEVEL = @"omicall/logLevel";
static NSString * OMICALL_TRANSFERED = @"omicall/call/transfer";
static NSString * OMICALL_CALL_ID = @"omicall/call/callID";
static NSString * OMICALL_IS_PARTIAL_PHONE_NUMBER = @"omikit/isPartialPhoneNumber";
static NSString * OMICALL_PHONE_MASK_POLICY = @"omikit/phoneMaskPolicy";
static NSString * OMICALL_IS_PROXY_DEV = @"omikit/isProxyDev";

/**
 * How the SDK masks a phone number when displaying it on CallKit / native UI.
 * - OMIPhoneMaskPolicyKeepLeading3    (default): "0987654321" -> "090*******"
 * - OMIPhoneMaskPolicyHideLast3                : "0987654321" -> "0987654***"
 * - OMIPhoneMaskPolicyKeepLeading4             : "0987654321" -> "0987*******"
 * - OMIPhoneMaskPolicyHideMiddleKeepLast       : "0987654321" -> "098****321"
 *
 * Set via [OmiClient setPhoneMaskPolicy:].
 * Maps 1-to-1 with the app's `hide_phone_type` field from the role API.
 */
typedef NS_ENUM(NSInteger, OMIPhoneMaskPolicy) {
    OMIPhoneMaskPolicyKeepLeading3       = 0,
    OMIPhoneMaskPolicyHideLast3          = 1,
    OMIPhoneMaskPolicyKeepLeading4       = 2,
    OMIPhoneMaskPolicyHideMiddleKeepLast = 3,
};
static NSString * KEY_OMI_DECLINE_CALL_USE_BUSY_HERE = @"omicall/declineCallUseBusyHere";
static NSString * KEY_ENABLE_CONFIG_SEND_ACTION_CALL = @"omicall/hasEnableConfigSendActionCall";

#pragma NOTI
static NSString * KEY_OMI_USER_NAME_KEY = @"omicall/userNameKey";
static NSString * KEY_OMI_REPRESENT_NAME = @"omicall/representName";

#pragma CALL EVENT
static NSString *const CALL_EVENT_HANGUP = @"HANGUP";
static NSString *const CALL_EVENT_ANSWERED = @"ANSWERED";
static NSString *const CALL_EVENT_TRANSFER = @"TRANSFER";

static NSString *const CALL_DIRECTION_INBOUND = @"inbound";
static NSString *const CALL_DIRECTION_OUTBOUND = @"outbound";

