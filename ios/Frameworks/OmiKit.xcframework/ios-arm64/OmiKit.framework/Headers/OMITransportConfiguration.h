//
//  OMITransportConfiguration.h
//  Copyright © 2015 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>

//#import <pjsip/sip_types.h>
//typedef enum pjsip_transport_type_e
//{
//    /** Unspecified. */
//    PJSIP_TRANSPORT_UNSPECIFIED,
//
//    /** UDP. */
//    PJSIP_TRANSPORT_UDP,
//
//    /** TCP. */
//    PJSIP_TRANSPORT_TCP,
//
//    /** TLS. */
//    PJSIP_TRANSPORT_TLS,
//
//    /** DTLS, not implemented yet. */
//    PJSIP_TRANSPORT_DTLS,
//
//    /** SCTP, not implemented yet. */
//    PJSIP_TRANSPORT_SCTP,
//
//    /** Loopback (stream, reliable) */
//    PJSIP_TRANSPORT_LOOP,
//
//    /** Loopback (datagram, unreliable) */
//    PJSIP_TRANSPORT_LOOP_DGRAM,
//
//    /** Start of user defined transport */
//    PJSIP_TRANSPORT_START_OTHER,
//
//    /** Start of IPv6 transports */
//    PJSIP_TRANSPORT_IPV6    = 128,
//
//    /** UDP over IPv6 */
//    PJSIP_TRANSPORT_UDP6 = PJSIP_TRANSPORT_UDP + PJSIP_TRANSPORT_IPV6,
//
//    /** TCP over IPv6 */
//    PJSIP_TRANSPORT_TCP6 = PJSIP_TRANSPORT_TCP + PJSIP_TRANSPORT_IPV6,
//
//    /** TLS over IPv6 */
//    PJSIP_TRANSPORT_TLS6 = PJSIP_TRANSPORT_TLS + PJSIP_TRANSPORT_IPV6,
//
//    /** DTLS over IPv6, not implemented yet */
//    PJSIP_TRANSPORT_DTLS6 = PJSIP_TRANSPORT_DTLS + PJSIP_TRANSPORT_IPV6
//
//} pjsip_transport_type_e;

/**
 *  The available transports to configure.
 */
typedef NS_ENUM(NSUInteger, OMITransportType) {
    /**
     *  UDP
     */
    OMITransportTypeUDP = 1,
    /**
     *  UDP6
     */
    OMITransportTypeUDP6 = 129,
    /**
     *  TCP
     */
    OMITransportTypeTCP = 2,
    /**
     *  TCP6
     */
    OMITransportTypeTCP6 = 130,
    /**
     * TLS
     */
    OMITransportTypeTLS = 3,
    /**
     * TLS6
     */
    OMITransportTypeTLS6 = 131

};
#define OMITransportTypeString(OMITransportType) [@[@"OMITransportTypeUDP", @"OMITransportTpeUDP6", @"OMITransportTypeTCP", @"OMITransportTypeTCP6", @"OMITransportTypeTLS", @"OMITransportTypeTLS6"] objectAtIndex:OMITransportType]

@interface OMITransportConfiguration : NSObject
/**
 *  The transport type that should be used.
 */
@property (nonatomic) OMITransportType transportType;

/**
 *  The port on which the communication should be set up.
 */
@property (nonatomic) NSUInteger port;

/**
 *  The port range that should be used.
 */
@property (nonatomic) NSUInteger portRange;

/**
 *  This function will init a OMITransportConfiguration with default settings
 *
 *  @param transportType Transport type that will be set.
 *
 *  @return OMITransportConfiguration instance.
 */
+ (instancetype _Nullable)configurationWithTransportType:(OMITransportType)transportType;

#define OMITransportStateName(pjsip_transport_state) [@[@"PJSIP_TP_STATE_CONNECTED", @"PJSIP_TP_STATE_DISCONNECTED", @"PJSIP_TP_STATE_SHUTDOWN", @"PJSIP_TP_STATE_DESTROY"] objectAtIndex:pjsip_transport_state]

@end
