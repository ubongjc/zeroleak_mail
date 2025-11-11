# ZeroLeak Mail - iOS Application

Native iOS app for ZeroLeak Mail with privacy-first email alias management, passkey authentication, and client-side encryption.

## Features

- **Passkey Authentication**: Native WebAuthn support with biometric authentication
- **Alias Management**: Create, view, and kill email aliases
- **Client-Side Encryption**: All sensitive data encrypted before leaving device
- **Receipts Export**: Export receipts to PDF/CSV for tax filing
- **Native iOS Experience**: SwiftUI with iOS design patterns

## Tech Stack

- **Framework**: SwiftUI
- **Language**: Swift 5.9+
- **Authentication**: AuthenticationServices (Passkeys/WebAuthn)
- **Encryption**: CryptoKit (AES-GCM)
- **Networking**: URLSession with async/await
- **Architecture**: MVVM with Combine

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+

## Project Structure

```
ZeroLeakMail/
├── App/
│   ├── ZeroLeakMailApp.swift        # App entry point
│   └── ContentView.swift            # Main navigation
├── Features/
│   ├── SignInView.swift             # Authentication screen
│   ├── AliasesListView.swift        # Aliases list & management
│   ├── CreateAliasView.swift        # Create new alias
│   ├── ReceiptsView.swift           # Receipts export
│   └── SettingsView.swift           # Settings & account
├── Networking/
│   └── APIClient.swift              # OpenAPI client
├── Crypto/
│   └── EncryptionManager.swift      # AES-GCM encryption
├── Models/
│   └── Alias.swift                  # Data models
└── Services/
    └── AuthenticationManager.swift  # Auth & passkey handling
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repo-url>
cd zeroleak_mail/zeroleak_ios
```

### 2. Open in Xcode

```bash
open ZeroLeakMail.xcodeproj
```

### 3. Configure Backend URL

Update the API base URL in `APIClient.swift`:

```swift
init(baseURL: String = "https://your-api-url.com") {
    // ...
}
```

### 4. Configure Passkey Domain

Update the relying party identifier in `AuthenticationManager.swift`:

```swift
let domain = "your-domain.com"
```

### 5. Build and Run

Select a simulator or device and press `Cmd+R` to build and run.

## Key Features Implementation

### Passkey Authentication

The app uses `AuthenticationServices` for native passkey support:

```swift
// Sign in with passkey
await authManager.signInWithPasskey(anchor: window)

// Register new passkey
await authManager.registerPasskey(
    anchor: window,
    userName: userName,
    userID: userData
)
```

### Client-Side Encryption

All sensitive data is encrypted using AES-GCM before upload:

```swift
let encryptionManager = try EncryptionManager(base64Key: key)

// Encrypt data
let ciphertext = try encryptionManager.encrypt(plaintextData)

// Decrypt data
let plaintext = try encryptionManager.decrypt(ciphertext)
```

Keys are securely stored in the iOS Keychain:

```swift
// Save key
try EncryptionManager.saveKeyToKeychain(key, identifier: "encryptionKey")

// Load key
let key = try EncryptionManager.loadKeyFromKeychain(identifier: "encryptionKey")
```

### API Integration

The API client provides type-safe methods matching the backend OpenAPI spec:

```swift
// Create alias
let alias = try await apiClient.createAlias(
    CreateAliasRequest(merchant: "Amazon", enableDecoy: true)
)

// List aliases
let response = try await apiClient.fetchAliases(status: .active)

// Kill alias
let killed = try await apiClient.killAlias(id: aliasId)

// Export receipts
let data = try await apiClient.exportReceipts(format: "pdf", taxYear: 2024)
```

## Security Features

### Keychain Storage

- Authentication tokens stored in Keychain with `kSecAttrAccessibleAfterFirstUnlock`
- Encryption keys stored with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`

### Network Security

- TLS 1.3 required for all connections
- Certificate pinning (configure in production)
- Bearer token authentication

### Client-Side Encryption

- AES-256-GCM for symmetric encryption
- CryptoKit native implementation
- Keys never leave device

## App Capabilities Required

Add these capabilities in Xcode:

1. **Sign in with Apple** (if using Apple ID)
2. **Keychain Sharing** (for secure credential storage)

## Privacy & Permissions

The app requires:

- **Network**: API communication
- **Keychain**: Secure credential storage
- **Biometric**: Optional for passkey authentication

No location, camera, contacts, or other sensitive permissions required.

## Building for Production

### 1. Update Bundle Identifier

```
com.zeroleak.mail
```

### 2. Configure Code Signing

- Set up proper provisioning profiles
- Enable Associated Domains capability
- Add webcredentials for passkey domain

### 3. Associated Domains

Add to entitlements:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>webcredentials:zeroleak.app</string>
</array>
```

### 4. Build Configuration

- Enable bitcode (if applicable)
- Set optimization level to `-O`
- Strip debug symbols

## Testing

### Unit Tests

```swift
// Test encryption
func testEncryption() async throws {
    let manager = try EncryptionManager(base64Key: testKey)
    let plaintext = "sensitive data"
    let encrypted = try manager.encryptString(plaintext)
    let decrypted = try manager.decryptString(encrypted)
    XCTAssertEqual(plaintext, decrypted)
}
```

### Integration Tests

Connect to staging backend for full flow testing.

## Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

## License

[License TBD]

## Support

- Documentation: [link]
- Issues: [link]
- Discord: [link]
