//
//  OMILogging.h
//  Copyright © 2017 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface OMILogging : NSObject

#define OMILog(flag, fnct, frmt, ...) \
[OMILogging logWithFlag: flag file:__FILE__ function: fnct line:__LINE__ format:(frmt), ## __VA_ARGS__]

#define OMILogVerbose(frmt, ...)    OMILog(16,    __PRETTY_FUNCTION__, frmt, ## __VA_ARGS__)
#define OMILogDebug(frmt, ...)      OMILog(8,      __PRETTY_FUNCTION__, frmt, ## __VA_ARGS__)
#define OMILogInfo(frmt, ...)       OMILog(4,       __PRETTY_FUNCTION__, frmt, ## __VA_ARGS__)
#define OMILogWarning(frmt, ...)    OMILog(2,    __PRETTY_FUNCTION__, frmt, ## __VA_ARGS__)
#define OMILogError(frmt, ...)      OMILog(1,      __PRETTY_FUNCTION__, frmt, ## __VA_ARGS__)

+ (void) logWithFlag:(int)flag
                file: (const char *_Nonnull)file
            function:(const char*_Nonnull)function
                line:(NSUInteger)line
              format:(NSString * _Nonnull)format, ... NS_FORMAT_FUNCTION(5, 6);
@end
