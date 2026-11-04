//
//  OMITurnConfiguration.h
//  OMISIPLib
//
//  Created by Maciek Gierszewski on 25/10/2017.
//

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSUInteger, OMIStunPasswordType) {
    OMIStunPasswordTypePlain = 0,
    OMIStunPasswordTypeHashed = 1,
};

/// How the client talks to the TURN server. This is the App↔TURN-server transport
/// (turn_conn_type), independent of the SIP signaling transport and of the media/RTP
/// transport (media always flows UDP through the relay once allocated).
///
/// The value is derived from the `?transport=` parameter the server publishes in its
/// TURN URL (e.g. `turn:host:2222?transport=tcp`). OMI cloud reads it from the dynamic
/// API provider list; on-premise reads it from the customer's configured TURN URL.
typedef NS_ENUM(NSUInteger, OMITurnConnType) {
    OMITurnConnTypeAuto = 0,  // No explicit transport in URL — fall back to the safe SDK default (UDP).
    OMITurnConnTypeUDP  = 1,  // ?transport=udp
    OMITurnConnTypeTCP  = 2,  // ?transport=tcp
    OMITurnConnTypeTLS  = 3,  // ?transport=tls (turns: scheme)
};

@interface OMITurnConfiguration : NSObject
@property (nonatomic, assign) BOOL enableTurn;
@property (nonatomic, assign) OMIStunPasswordType passwordType;

/// App↔TURN-server transport, parsed from the server's TURN URL. Defaults to Auto.
@property (nonatomic, assign) OMITurnConnType connType;

@property (nonatomic, strong) NSString * _Nullable server;
@property (nonatomic, strong) NSString * _Nullable username;
@property (nonatomic, strong) NSString * _Nullable password;

/// Parse the `?transport=` parameter from a raw TURN URL into an OMITurnConnType.
/// Returns OMITurnConnTypeAuto when the URL is nil/empty or has no transport param.
///   "turn:host:2222?transport=tcp" -> OMITurnConnTypeTCP
///   "turns:host:443?transport=tcp" -> OMITurnConnTypeTLS  (turns: scheme implies TLS)
///   "turn:host:3478"               -> OMITurnConnTypeAuto
+ (OMITurnConnType)connTypeFromURL:(NSString * _Nullable)url;

/// Strip the scheme (`turn:`/`turns:`/`stun:`) and query string (`?transport=...`)
/// from a raw TURN/STUN URL, leaving the bare "host:port" that PJSIP's turn_server
/// expects. Returns the input unchanged when nil/empty.
///   "turns:host:443?transport=tcp" -> "host:443"
///   "turn:host:2222?transport=tcp" -> "host:2222"
///   "host:3478"                    -> "host:3478"
+ (NSString * _Nullable)normalizeServerURL:(NSString * _Nullable)url;

@end
