//
//  OMIVideoCodecs.h
//  OMISIPLib
//
//  Created by Redmer Loen on 4/5/18.
//

#import <Foundation/Foundation.h>


typedef NS_ENUM(NSInteger, OMIVideoCodec) {
        // H264
    OMIVideoCodecH264
};
#define OMIVideoCodecString(OMIVideoCodec) [OMIVideoCodecArray objectAtIndex:OMIVideoCodec]
#define OMIVideoCodecStringWithIndex(NSInteger) [OMIVideoCodecArray objectAtIndex:NSInteger]
#define OMIVideoCodecArray @[@"H264/97"]


@interface OMIVideoCodecs : NSObject

/**
 *  The prioritiy of the codec
 */
@property (readonly, nonatomic) NSUInteger priority;

/**
 * The used codec.
 */
@property (readonly, nonatomic) OMIVideoCodec codec;

/**
 * Make the default init unavaibale.
 */
- (instancetype _Nonnull) init __attribute__((unavailable("init not available. Use initWithVideoCodec instead.")));

/**
 * The init to setup the video codecs.
 *
 * @param codec     Audio codec codec to set the prioritiy for.
 * @param priority  NSUInteger the priority the codec will have.
 */
- (instancetype _Nonnull)initWithVideoCodec:(OMIVideoCodec)codec andPriority:(NSUInteger)priority;

/**
 * Get the codec from the #define OMIVideoCodecString with a OMIVideoCodec type.
 *
 * @param codec OMIVideoCodec the codec to get the string representation of.
 *
 * @return NSString the string representation of the OMIVideoCodec type.
 */
+ (NSString * _Nonnull)codecString:(OMIVideoCodec)codec;

/**
 * Get the codec from the defined OMIVideoCodecString with an index.
 */
+ (NSString * _Nonnull)codecStringWithIndex:(NSInteger)index;

@end
