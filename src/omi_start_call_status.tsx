export enum OmiStartCallStatus {
  invalidUuid = 0,
  invalidPhoneNumber = 1,
  samePhoneNumber = 2,
  maxRetry = 3,
  permissionDenied = 4,
  couldNotFindEndpoint = 5,
  accountRegisterFailed = 6,
  startCallFailed = 7,
  startCallSuccess = 8,
  haveAnotherCall = 9,
}
