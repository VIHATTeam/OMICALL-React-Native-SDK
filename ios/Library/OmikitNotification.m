//
//  OmikitNotification.m
//  DoubleConversion
//
//  Created by PRO 2019 16' on 20/04/2023.
//

#import <Foundation/Foundation.h>
#if __has_include("OmikitNotification.h")
#import "OmikitNotification.h"
#elif __has_include(<OmikitPlugin/OmikitPlugin-Swift.h>)
#import <OmikitPlugin/OmikitPlugin-Swift.h>
#else
#import <omikit_plugin/OmikitNotification.h>
#endif

@implementation OmikitNotification : NSObject 
+ (void)didRecieve:(NSDictionary*) userInfo{
    [[OmikitPlugin instance] didReceiveWithData:userInfo];
}
@end
