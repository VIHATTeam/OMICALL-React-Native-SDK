/**
 * Status codes returned by startCall() function
 * Use these to handle different call initiation results
 */
export enum OmiStartCallStatus {
  // Validation errors (0-3)
  invalidUuid = 0,              // Invalid user UUID
  invalidPhoneNumber = 1,       // Invalid phone number format
  samePhoneNumber = 2,          // Cannot call same phone number
  maxRetry = 3,                 // Maximum retry attempts reached

  // Permission errors (4, 450-452)
  permissionDenied = 4,         // Microphone/Camera permission denied
  permissionMicrophone = 450,   // Microphone permission required (Android 15+)
  permissionCamera = 451,       // Camera permission required (Android 15+)
  permissionOverlay = 452,      // System alert window permission required (Android 15+)

  // Call errors (5-7)
  couldNotFindEndpoint = 5,     // Could not find endpoint
  accountRegisterFailed = 6,    // Account registration failed
  startCallFailed = 7,          // Start call failed

  // Success statuses (8, 407)
  startCallSuccess = 8,         // Call initiated successfully (Android)
  startCallSuccessIOS = 407,    // Call initiated successfully (iOS)

  // Other errors (9+)
  haveAnotherCall = 9,          // Already have another call in progress
}
