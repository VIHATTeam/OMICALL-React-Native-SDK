//
//  OmikitNotification.m
//  DoubleConversion
//
//  Created by PRO 2019 16' on 20/04/2023.
//

#import <Foundation/Foundation.h>
#import <OmikitPlugin/OmikitPlugin-Swift.h>


@implementation OmikitNotification : NSObject 
+ (void)didRecieve:(NSDictionary*) userInfo{
    [[OmikitPlugin instance] didReceiveWithData:userInfo];
}
@end
