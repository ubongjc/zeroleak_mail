import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var email = ""
    @State private var showMagicLinkSent = false
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                // Logo and branding
                VStack(spacing: 16) {
                    Image(systemName: "envelope.badge.shield.half.filled")
                        .font(.system(size: 80))
                        .foregroundStyle(.blue)

                    Text("ZeroLeak Mail")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text("Privacy-first email aliases")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 60)

                Spacer()

                // Sign in options
                VStack(spacing: 16) {
                    // Passkey sign in (primary)
                    Button(action: signInWithPasskey) {
                        Label("Sign in with Passkey", systemImage: "key.fill")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }

                    // Divider
                    HStack {
                        Rectangle()
                            .frame(height: 1)
                            .foregroundColor(.secondary.opacity(0.3))
                        Text("or")
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 8)
                        Rectangle()
                            .frame(height: 1)
                            .foregroundColor(.secondary.opacity(0.3))
                    }
                    .padding(.vertical, 8)

                    // Magic link fallback
                    VStack(spacing: 12) {
                        TextField("Email address", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)

                        Button(action: sendMagicLink) {
                            if isLoading {
                                ProgressView()
                                    .frame(maxWidth: .infinity)
                            } else {
                                Label("Send Magic Link", systemImage: "envelope")
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .padding()
                        .background(email.isEmpty ? Color.gray : Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .disabled(email.isEmpty || isLoading)
                    }
                }
                .padding(.horizontal, 32)

                Spacer()

                // Privacy notice
                Text("We never share your data. Period.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.bottom, 32)
            }
            .alert("Magic Link Sent", isPresented: $showMagicLinkSent) {
                Button("OK", role: .cancel) { }
            } message: {
                Text("Check your email for a sign-in link.")
            }
        }
    }

    private func signInWithPasskey() {
        Task {
            do {
                guard let window = UIApplication.shared.connectedScenes
                    .compactMap({ $0 as? UIWindowScene })
                    .first?.windows.first else {
                    return
                }
                try await authManager.signInWithPasskey(anchor: window)
            } catch {
                print("Passkey sign-in failed: \(error)")
            }
        }
    }

    private func sendMagicLink() {
        isLoading = true
        Task {
            do {
                try await authManager.requestMagicLink(email: email)
                await MainActor.run {
                    isLoading = false
                    showMagicLinkSent = true
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                }
                print("Magic link failed: \(error)")
            }
        }
    }
}

#Preview {
    SignInView()
        .environmentObject(AuthenticationManager())
}
