import Foundation
import CryptoKit

enum EncryptionError: Error {
    case encryptionFailed
    case decryptionFailed
    case invalidKey
    case invalidData
}

/// Client-side encryption manager using AES-GCM
class EncryptionManager {
    private let symmetricKey: SymmetricKey

    init(key: Data) throws {
        guard key.count == 32 else {
            throw EncryptionError.invalidKey
        }
        self.symmetricKey = SymmetricKey(data: key)
    }

    /// Convenience initializer with base64-encoded key
    convenience init(base64Key: String) throws {
        guard let keyData = Data(base64Encoded: base64Key) else {
            throw EncryptionError.invalidKey
        }
        try self.init(key: keyData)
    }

    /// Encrypt data using AES-GCM
    /// - Parameter data: Plain data to encrypt
    /// - Returns: Encrypted data including nonce and tag
    func encrypt(_ data: Data) throws -> Data {
        do {
            let sealedBox = try AES.GCM.seal(data, using: symmetricKey)
            guard let combined = sealedBox.combined else {
                throw EncryptionError.encryptionFailed
            }
            return combined
        } catch {
            throw EncryptionError.encryptionFailed
        }
    }

    /// Decrypt data using AES-GCM
    /// - Parameter encryptedData: Encrypted data including nonce and tag
    /// - Returns: Decrypted plain data
    func decrypt(_ encryptedData: Data) throws -> Data {
        do {
            let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)
            let decryptedData = try AES.GCM.open(sealedBox, using: symmetricKey)
            return decryptedData
        } catch {
            throw EncryptionError.decryptionFailed
        }
    }

    /// Encrypt string to base64-encoded ciphertext
    func encryptString(_ string: String) throws -> String {
        guard let data = string.data(using: .utf8) else {
            throw EncryptionError.invalidData
        }
        let encrypted = try encrypt(data)
        return encrypted.base64EncodedString()
    }

    /// Decrypt base64-encoded ciphertext to string
    func decryptString(_ base64String: String) throws -> String {
        guard let encryptedData = Data(base64Encoded: base64String) else {
            throw EncryptionError.invalidData
        }
        let decrypted = try decrypt(encryptedData)
        guard let string = String(data: decrypted, encoding: .utf8) else {
            throw EncryptionError.invalidData
        }
        return string
    }

    // MARK: - Key Generation

    /// Generate a new random symmetric key
    static func generateKey() -> SymmetricKey {
        return SymmetricKey(size: .bits256)
    }

    /// Generate a new random key and return as base64 string
    static func generateBase64Key() -> String {
        let key = generateKey()
        return key.withUnsafeBytes { bytes in
            Data(bytes).base64EncodedString()
        }
    }
}

// MARK: - Secure Storage Extension

extension EncryptionManager {
    /// Save encryption key to Keychain
    static func saveKeyToKeychain(_ key: SymmetricKey, identifier: String) throws {
        let keyData = key.withUnsafeBytes { Data($0) }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: identifier,
            kSecValueData as String: keyData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        // Delete any existing key first
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw EncryptionError.encryptionFailed
        }
    }

    /// Load encryption key from Keychain
    static func loadKeyFromKeychain(identifier: String) throws -> SymmetricKey {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: identifier,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let keyData = result as? Data else {
            throw EncryptionError.invalidKey
        }

        return SymmetricKey(data: keyData)
    }

    /// Delete encryption key from Keychain
    static func deleteKeyFromKeychain(identifier: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: identifier
        ]
        SecItemDelete(query as CFDictionary)
    }
}
