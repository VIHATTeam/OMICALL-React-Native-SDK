//
//  OMIIpChangeConfiguration.h
//  Copyright © 2018 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, OMIIpChangeConfigurationIpChangeCalls) {
    /**
     * Use the ip change from pjsip.
     */
    OMIIpChangeConfigurationIpChangeCallsDefault,
    /**
     * Do the reinvite of the calls self instead of pjsip.
     */
    OMIIpChangeConfigurationIpChangeCallsReinvite,
    /**
     * Do an UPDATE sip message instead of a INVITE that is done by pjsip.
     */
    OMIIpChangeConfigurationIpChangeCallsUpdate
};
#define OMIEndpointIpChangeCallsString(OMIEndpointIpChangeCalls) [@[@"OMIIpChangeConfigurationIpChangeCallsDefault", @"OMIIpChangeConfigurationIpChangeCallsReinvite", @"OMIIpChangeConfigurationIpChangeCallsUpdate"] objectAtIndex:OMIEndpointIpChangeCalls]

typedef NS_ENUM(NSUInteger, OMIReinviteFlags) {
    /**
     * Deinitialize and recreate media, including media transport. This flag
     * is useful in IP address change situation, if the media transport
     * address (or address family) changes, for example during IPv4/IPv6
     * network handover.
     * This flag is only valid for #pjsua_call_reinvite()/reinvite2(), or
     * #pjsua_call_update()/update2().
     *
     * Warning: If the re-INVITE/UPDATE fails, the old media will not be
     * reverted.
     */
    OMIReinviteFlagsReinitMedia = 16,
    /**
     * Update the local invite session's contact with the contact URI from
     * the account. This flag is only valid for #pjsua_call_set_hold2(),
     * #pjsua_call_reinvite() and #pjsua_call_update(). This flag is useful
     * in IP address change situation, after the local account's Contact has
     * been updated (typically with re-registration) use this flag to update
     * the invite session with the new Contact and to inform this new Contact
     * to the remote peer with the outgoing re-INVITE or UPDATE.
     */
    OMIReinviteFlagsUpdateContact = 2,
    /**
     * Update the local invite session's Via with the via address from
     * the account. This flag is only valid for #pjsua_call_set_hold2(),
     * #pjsua_call_reinvite() and #pjsua_call_update(). Similar to
     * the flag PJSUA_CALL_UPDATE_CONTACT above, this flag is useful
     * in IP address change situation, after the local account's Via has
     * been updated (typically with re-registration).
     */
    OMIReinviteFlagsUpdateVia = 32
};
#define OMIReinviteFlagsString(OMIReinviteFlags) [@[@"OMIReinviteFlagsReinitMedia", @"OMIReinviteFlagsUpdateContact", @"OMIReinviteFlagsUpdateVia"] objectAtIndex:OMIReinviteFlags]

@interface OMIIpChangeConfiguration : NSObject

@property (nonatomic) OMIIpChangeConfigurationIpChangeCalls ipChangeCallsUpdate;

/**
 * Should the old transport be cleaned up.
 */
@property (nonatomic) BOOL ipAddressChangeShutdownTransport;

/**
 * Should all calls be ended when an ip address change has been detected.
 *
 * Default: NO
 */
@property (nonatomic) BOOL ipAddressChangeHangupAllCalls;

/**
 * When ipAddressChangeHangupAllCalls is set to NO, this property should be set.
 *
 * Default: OMIReinviteFlagsReinitMedia | OMIReinviteFlagsUpdateVia | OMIReinviteFlagsUpdateContact
 */
@property (nonatomic) OMIReinviteFlags ipAddressChangeReinviteFlags;

/**
 * Return the default reinvite flags
 */
+ (OMIReinviteFlags)defaultReinviteFlags;
@end
