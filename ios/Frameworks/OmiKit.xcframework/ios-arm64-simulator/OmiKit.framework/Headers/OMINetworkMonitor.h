//
//  OMINetworkMonitor.h
//  Copyright © 2016 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>

/**
 *  Notification that will be posted when an IP address change is detected.
 */
extern NSString * _Nonnull const OMINetworkMonitorChangedNotification;

@interface OMINetworkMonitor : NSObject

/**
 *  Create a monitoring class that will notify when the internet connection has changed.
 *
 *  @param host NSString with the host that should be checked for reachability.
 *
 *  @return OMINetworkMonitor instance.
 */
- (OMINetworkMonitor * _Nullable)initWithHost:(NSString *_Nonnull)host;

/**
 *  This will start the monitoring of the IP address.
 */
- (void)startMonitoring;

/**
 *  This will stop the monitoring of the IP address.
 */
- (void)stopMonitoring;

- (BOOL)isObservingMonitoring;

- (void)deallocNSNotification;

@end
