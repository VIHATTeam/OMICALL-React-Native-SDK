//
//  OMICallInfo.h
//  OmiKit
//
//  Created by H-Solutions on 24/10/2023.
//

#import <Foundation/Foundation.h>

@interface OMICallInfoItem: NSObject
@property (nonatomic, strong) NSString *transaction_id;
@property (nonatomic, strong) NSArray<NSDictionary *> *rtp_logs;
- (NSDictionary *)toDictionary;
@end

 @interface RTPInfo : NSObject

 @property (nonatomic, strong) NSString *ext;
 @property (nonatomic, strong) NSDictionary *mos;
 @property (nonatomic, strong) NSDictionary *jitter;
 @property (nonatomic, strong) NSDictionary *latency;
 @property (nonatomic, strong) NSString *leg_name;
 @property (nonatomic, strong) NSArray<NSDictionary *> *details;
 @property (nonatomic, strong) NSString *network_type;
 @property (nonatomic, strong) NSDictionary *ppl;
 @property (nonatomic, strong) NSNull *network_speed; // Sử dụng NSNull cho dữ liệu null
 @property (nonatomic, strong) NSString *device;

- (NSDictionary *)toDictionary;

- (void)encodeWithCoder:(NSCoder *)encoder;
 @end

 @interface DetailRTPInfo : NSObject

 @property (nonatomic, strong) NSNumber *mos;
 @property (nonatomic, strong) NSString *at;
 @property (nonatomic, strong) NSNumber *jitter;
 @property (nonatomic, strong) NSNumber *latency;
 @property (nonatomic, strong) NSNumber *ppl;
 @property (nonatomic, strong) NSString *time;


- (NSDictionary *)toDictionary;

 @end

@interface AveragedItemInfo : NSObject
@property (nonatomic, strong) NSNumber *avg;
@property (nonatomic, strong) NSNumber *min;
@property (nonatomic, strong) NSNumber *max;
@property (nonatomic, strong) NSNumber *total;
@end

@interface OMICallInfo: NSObject

@property (readonly, nonatomic) NSArray * _Nullable listDetailRTPInfo;

@property (readonly, nonatomic) NSArray * _Nullable listOMICallInfo;
/**
 *  The shared instance for the endpoint
 *
 *  @return The singleton instance.
 */
+ (instancetype _Nonnull)sharedInstance;


- (void)addDetailRTPInfo:(DetailRTPInfo * _Nonnull)detailRTPInfo;

- (void)addOMICallInfo:(NSString * _Nonnull)transaction_id ext:(NSString*_Nonnull) ext leg_name:(NSString* _Nonnull) leg_name total_time:(NSNumber* _Nonnull) total_time;

- (void)removeDetailRTPInfo;

- (void)removeOMICallInfo;

- (void)removeObjectOMICallInfo:(OMICallInfoItem * _Nonnull)_OMICallInfoItem;

- (NSArray *)processListDetailByPeriod:(NSNumber *_Nonnull)period listData:(NSArray *)listData;

@end


