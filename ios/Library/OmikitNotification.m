//
//  OmikitNotification.m
//  DoubleConversion
//
//  Created by PRO 2019 16' on 20/04/2023.
//

#import <Foundation/Foundation.h>
#if __has_include("OmikitPlugin-Swift.h")
#import <OmikitPlugin-Swift.h> 
#else
#import <OmikitPlugin/OmikitPlugin-Swift.h> 
#endif

@implementation OmikitNotification : NSObject 
+ (void)didRecieve:(NSDictionary*) userInfo{
    [[OmikitPlugin instance] didReceiveWithData:userInfo];
}
@end
