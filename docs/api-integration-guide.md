# API Integration Guide — App-to-App (v4.0+)

Starting from **version 4.0**, customers using the **App-to-App** service must call the OMICALL API to provision SIP extensions before initializing the SDK. After a successful API call, use the returned credentials to call `initCallWithUserPassword()` with `isSkipDevices: true`.

---

## Table of Contents

- [API Integration Guide — App-to-App (v4.0+)](#api-integration-guide--app-to-app-v40)
  - [Table of Contents](#table-of-contents)
  - [Concepts](#concepts)
  - [Authentication](#authentication)
  - [API Endpoints](#api-endpoints)
    - [1. Create Agent Extension](#1-create-agent-extension)
    - [2. Create Customer Extension](#2-create-customer-extension)
    - [3. Assign Outbound Hotline to Agent](#3-assign-outbound-hotline-to-agent)
    - [4. Add Device](#4-add-device)
    - [5. Logout](#5-logout)
  - [SDK Integration Flow](#sdk-integration-flow)
    - [Step-by-step](#step-by-step)
  - [Full Example](#full-example)

---

## Concepts

| Role | Description | Extension Prefix | Capabilities |
|------|-------------|------------------|--------------|
| **Agent** (Collaborator) | An employee of the business. Not allowed to log in to the OMICall CRM, but can use business hotlines to make telecom calls, internal calls between agents, or internal calls with customers. | `1111111x` (8+ digits) | Outbound telecom calls via hotline, internal calls |
| **Customer** | An end-user who can only make internal calls to the business's internal lines. Cannot use hotlines for outbound telecom calls. | `4444444x` (8+ digits) | Internal calls only |

---

## Authentication

All API requests require a **Bearer token** obtained from the OMICALL Auth API.

**Auth endpoint:** `https://api.omicall.com/omicall-api/authentication`

Include the token in every request header:

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

---

## API Endpoints

**Base URL:** `https://app-2-app-stg.omicrm.com`

> **Note:** This is the staging URL. Contact OMICALL for the production URL.

### 1. Create Agent Extension

Provision a SIP extension for an agent (collaborator).

```
POST /sdk-app/call-center/agent-extension/init
```

**Request Body:**

```json
{
  "uuid": "xxx-xxx-xxx",
  "phoneNumber": {
    "number": "983223550",
    "region": "VN"
  },
  "sipNumber": "8989222222",
  "fullName": "User 01"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | string | Yes | Unique identifier for the agent |
| `phoneNumber.number` | string | Yes | Agent's phone number |
| `phoneNumber.region` | string | Yes | Country code (e.g., `VN`) |
| `sipNumber` | string | Yes | Outbound hotline number assigned to the agent |
| `fullName` | string | Yes | Agent's display name |

**Response (200):**

```json
{
  "keyEnabled": false,
  "payload": {
    "domain": "omicalltest1",
    "outboundProxy": "vh.omicrm.com",
    "extension": "11111113",
    "password": "ienD5bsc"
  },
  "statusCode": 9999,
  "status_code": 9999
}
```

| Response Field | Description |
|----------------|-------------|
| `payload.domain` | SIP realm/domain — use as `realm` in SDK |
| `payload.outboundProxy` | SIP proxy server — use as `host` in SDK |
| `payload.extension` | SIP extension number — use as `userName` in SDK |
| `payload.password` | SIP password — use as `password` in SDK |

---

### 2. Create Customer Extension

Provision a SIP extension for a customer.

```
POST /sdk-app/call-center/customer-extension/init
```

**Request Body:**

```json
{
  "uuid": "xxx-xxx-xxx",
  "phoneNumber": {
    "number": "983223550",
    "region": "VN"
  },
  "fullName": "Customer 01"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | string | Yes | Unique identifier for the customer |
| `phoneNumber.number` | string | Yes | Customer's phone number |
| `phoneNumber.region` | string | Yes | Country code (e.g., `VN`) |
| `fullName` | string | Yes | Customer's display name |

> **Note:** No `sipNumber` field — customers cannot make outbound telecom calls.

**Response (200):**

```json
{
  "keyEnabled": false,
  "payload": {
    "domain": "omicalltest1",
    "outboundProxy": "vh.omicrm.com",
    "sipUser": "44444443",
    "password": "ienD5bsc"
  },
  "statusCode": 9999,
  "status_code": 9999
}
```

| Response Field | Description |
|----------------|-------------|
| `payload.domain` | SIP realm/domain — use as `realm` in SDK |
| `payload.outboundProxy` | SIP proxy server — use as `host` in SDK |
| `payload.sipUser` | SIP extension number — use as `userName` in SDK |
| `payload.password` | SIP password — use as `password` in SDK |

---

### 3. Assign Outbound Hotline to Agent

Assign a hotline number for outbound telecom calls to one or more agent extensions.

```
POST /sdk-app/call-center/agent-extension/assign-phone-out
```

**Request Body:**

```json
{
  "extensions": ["11111112", "11111113"],
  "sipNumber": "8989222222"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `extensions` | string[] | Yes | List of agent extensions to assign |
| `sipNumber` | string | Yes | Hotline number for outbound telecom calls |

**Response (200):**

```json
{
  "keyEnabled": false,
  "payload": true,
  "statusCode": 9999,
  "status_code": 9999
}
```

---

### 4. Add Device

Register a device for push notifications (required for receiving incoming calls).

**Agent:**
```
POST /sdk-app/call-center/agent-extension/add-device
```

**Customer:**
```
POST /sdk-app/call-center/customer-extension/add-device
```

**Request Body:**

```json
{
  "extension": "11111112",
  "uuid": "xxx-xxx-xxx",
  "device": {
    "projectId": "project-2025",
    "appId": "myapp-2025-01",
    "deviceId": "device-id-here",
    "token": "fcm-token-here",
    "type": "ANDROID",
    "voipToken": "voip-token-here"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `extension` | string | Yes | The SIP extension |
| `uuid` | string | Yes | Unique identifier of the user |
| `device.projectId` | string | Yes | Project ID |
| `device.appId` | string | Yes | Application ID |
| `device.deviceId` | string | Yes | Device identifier |
| `device.token` | string | Yes | FCM push token (for Android & iOS) |
| `device.type` | string | Yes | `"ANDROID"` or `"IOS"` |
| `device.voipToken` | string | iOS only | VoIP push token (PushKit, iOS only) |

> **Tip:** Use SDK getter functions to retrieve these values:
> - `getProjectId()` → `projectId` (this is your **Firebase project ID**)
> - `getAppId()` → `appId`
> - `getDeviceId()` → `deviceId`
> - `getFcmToken()` → `token`
> - `getVoipToken()` → `voipToken` (iOS only)

**Response (200):**

```json
{
  "keyEnabled": false,
  "payload": true,
  "statusCode": 9999,
  "status_code": 9999
}
```

---

### 5. Logout

Remove device registration and logout the extension.

> **Important:**
> - This API removes device info from the server. If you **do not** call logout before switching users, **both devices using the same SIP extension will receive incoming calls simultaneously**.
> - When changing user credentials (e.g., switching accounts), you **must** call Logout first, then login again with the new credentials.
> - Use SDK getter functions (`getProjectId()`, `getAppId()`, `getDeviceId()`) to retrieve the required parameters.

**Agent:**
```
POST /sdk-app/call-center/agent-extension/logout
```

**Customer:**
```
POST /sdk-app/call-center/customer-extension/logout
```

**Request Body:**

```json
{
  "extension": "11111112",
  "projectId": "project-2025",
  "appId": "myapp-2025-01",
  "deviceId": "device-id-here"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `extension` | string | Yes | The SIP extension to logout |
| `projectId` | string | Yes | Project ID |
| `appId` | string | Yes | Application ID |
| `deviceId` | string | Yes | Device identifier |

**Response (200):**

```json
{
  "keyEnabled": false,
  "payload": true,
  "statusCode": 9999,
  "status_code": 9999
}
```

---

## SDK Integration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     App-to-App Integration Flow                     │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────┐          ┌──────────┐          ┌──────────┐
  │ Your App │          │ OMICALL  │          │  Native  │
  │ (Server) │          │   API    │          │   SDK    │
  └────┬─────┘          └────┬─────┘          └────┬─────┘
       │                     │                     │
       │  1. Auth Token      │                     │
       ├────────────────────►│                     │
       │◄────────────────────┤                     │
       │                     │                     │
       │  2. Create Extension│                     │
       │  (agent or customer)│                     │
       ├────────────────────►│                     │
       │  {domain, extension,│                     │
       │   password, proxy}  │                     │
       │◄────────────────────┤                     │
       │                     │                     │
       │               3. startServices()          │
       │──────────────────────────────────────────►│
       │                     │                     │
       │               4. initCallWithUserPassword │
       │                  (isSkipDevices: true)     │
       │──────────────────────────────────────────►│
       │                     │                     │
       │               5. Ready to make/receive calls
       │                     │                     │
```

### Step-by-step

1. **Get auth token** from OMICALL Auth API
2. **Call Create Extension API** (agent or customer) to get SIP credentials
3. **Initialize the SDK** with `startServices()`
4. **Login with returned credentials** using `initCallWithUserPassword()` with `isSkipDevices: true`
5. **(Optional)** Call **Add Device API** if you manage devices server-side

---

## Full Example

```typescript
import {
  startServices,
  initCallWithUserPassword,
  getProjectId,
  getAppId,
  getDeviceId,
  getFcmToken,
  getVoipToken,
} from 'omikit-plugin';

// ---------- 1. Call your backend to create extension ----------
// Your backend should call the OMICALL API and return the credentials.
// Do NOT call the OMICALL API directly from the mobile app
// (to protect your Bearer token).

const credentials = await myBackend.createExtension({
  uuid: 'user-unique-id',
  phoneNumber: { number: '983223550', region: 'VN' },
  fullName: 'User 01',
  // For agents, also include: sipNumber: '8989222222'
});

// credentials = {
//   domain: 'omicalltest1',         → realm
//   outboundProxy: 'vh.omicrm.com', → host
//   extension: '11111113',          → userName
//   password: 'ienD5bsc',           → password
// }

// ---------- 2. Initialize SDK ----------
await startServices();

// ---------- 3. Login with SIP credentials ----------
await initCallWithUserPassword({
  userName: credentials.extension,     // SIP extension from API
  password: credentials.password,      // SIP password from API
  realm: credentials.domain,           // SIP domain from API
  host: credentials.outboundProxy,     // SIP proxy from API
  isVideo: false,
  fcmToken: 'your-fcm-token',
  isSkipDevices: true,                 // Required for App-to-App
});

// ---------- 4. (Optional) Add device via API ----------
// If managing devices server-side, retrieve SDK values:
const projectId = await getProjectId();
const appId = await getAppId();
const deviceId = await getDeviceId();
const fcmToken = await getFcmToken();
const voipToken = await getVoipToken(); // iOS only

await myBackend.addDevice({
  extension: credentials.extension,
  uuid: 'user-unique-id',
  device: {
    projectId,
    appId,
    deviceId,
    token: fcmToken,
    type: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    voipToken: voipToken ?? undefined,
  },
});

// ---------- 5. Ready — make or receive calls ----------
// See README.md for call control usage.
```

> **Important:** Always call the OMICALL API from your **backend server**, not directly from the mobile app. This protects your Bearer token from being exposed in client-side code.
