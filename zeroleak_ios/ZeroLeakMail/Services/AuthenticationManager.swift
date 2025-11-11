import Foundation
import AuthenticationServices
import Combine

class AuthenticationManager: NSObject, ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var authError: Error?

    private let apiClient: APIClient
    private let keychainIdentifier = "com.zeroleak.authToken"

    override init() {
        self.apiClient = APIClient()
        super.init()
    }

    // MARK: - Authentication State

    func checkAuthStatus() async {
        if let token = loadTokenFromKeychain() {
            apiClient.setAuthToken(token)
            await MainActor.run {
                self.isAuthenticated = true
            }
            // TODO: Fetch user profile
        }
    }

    func signOut() {
        deleteTokenFromKeychain()
        apiClient.clearAuthToken()
        isAuthenticated = false
        currentUser = nil
    }

    // MARK: - Passkey Authentication

    /// Sign in using passkey (WebAuthn)
    @MainActor
    func signInWithPasskey(anchor: ASPresentationAnchor) async throws {
        // Create authentication request
        let challenge = generateChallenge()
        let domain = "zeroleak.app"  // Replace with your domain

        let platformProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: domain)
        let assertionRequest = platformProvider.createCredentialAssertionRequest(challenge: challenge)

        let authController = ASAuthorizationController(authorizationRequests: [assertionRequest])
        authController.delegate = self
        authController.presentationContextProvider = self

        authController.performRequests()
    }

    /// Register new passkey
    @MainActor
    func registerPasskey(anchor: ASPresentationAnchor, userName: String, userID: Data) async throws {
        let challenge = generateChallenge()
        let domain = "zeroleak.app"  // Replace with your domain

        let platformProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: domain)
        let registrationRequest = platformProvider.createCredentialRegistrationRequest(
            challenge: challenge,
            name: userName,
            userID: userID
        )

        let authController = ASAuthorizationController(authorizationRequests: [registrationRequest])
        authController.delegate = self
        authController.presentationContextProvider = self

        authController.performRequests()
    }

    // MARK: - Magic Link (Fallback)

    /// Request magic link to email
    func requestMagicLink(email: String) async throws {
        // TODO: Implement magic link request
        // This would call your backend to send an email with a magic link
    }

    /// Validate magic link token
    func validateMagicLink(token: String) async throws {
        // TODO: Implement magic link validation
        // Exchange the token for an auth token
    }

    // MARK: - Private Helpers

    private func generateChallenge() -> Data {
        var bytes = [UInt8](repeating: 0, count: 32)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return Data(bytes)
    }

    private func saveTokenToKeychain(_ token: String) {
        let data = token.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keychainIdentifier,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    private func loadTokenFromKeychain() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keychainIdentifier,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }

        return token
    }

    private func deleteTokenFromKeychain() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keychainIdentifier
        ]
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - ASAuthorizationControllerDelegate

extension AuthenticationManager: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        Task {
            if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion {
                // Handle passkey sign-in
                // TODO: Send credential to backend for validation
                await handlePasskeyAssertion(credential)
            } else if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration {
                // Handle passkey registration
                // TODO: Send credential to backend for registration
                await handlePasskeyRegistration(credential)
            }
        }
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        Task { @MainActor in
            self.authError = error
        }
    }

    private func handlePasskeyAssertion(_ credential: ASAuthorizationPlatformPublicKeyCredentialAssertion) async {
        // TODO: Send to backend and receive auth token
        // For now, just mark as authenticated
        await MainActor.run {
            self.isAuthenticated = true
        }
    }

    private func handlePasskeyRegistration(_ credential: ASAuthorizationPlatformPublicKeyCredentialRegistration) async {
        // TODO: Send to backend to complete registration
        await MainActor.run {
            self.isAuthenticated = true
        }
    }
}

// MARK: - ASAuthorizationControllerPresentationContextProviding

extension AuthenticationManager: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        // Return the main window
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first else {
            fatalError("No window available")
        }
        return window
    }
}

// MARK: - User Model

struct User: Codable {
    let id: String
    let email: String
    let role: String
    let customDomain: String?
}
