import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var showSignOutConfirmation = false
    @State private var showDeleteAccount = false

    var body: some View {
        NavigationStack {
            List {
                // Account section
                Section {
                    if let user = authManager.currentUser {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(user.email)
                                    .font(.body)
                                Text(user.role.capitalized)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            if user.role == "PREMIUM" {
                                Image(systemName: "star.fill")
                                    .foregroundStyle(.yellow)
                            }
                        }
                    }
                } header: {
                    Text("Account")
                }

                // Subscription
                Section {
                    NavigationLink(destination: SubscriptionView()) {
                        HStack {
                            Image(systemName: "star.circle.fill")
                                .foregroundStyle(.yellow)
                            Text("Upgrade to Premium")
                        }
                    }

                    NavigationLink(destination: CustomDomainView()) {
                        HStack {
                            Image(systemName: "globe")
                            Text("Custom Domain")
                        }
                    }
                } header: {
                    Text("Premium Features")
                } footer: {
                    Text("Unlock custom domains, unlimited aliases, and priority support")
                }

                // Security
                Section {
                    NavigationLink(destination: PasskeysView()) {
                        Label("Passkeys", systemImage: "key.fill")
                    }

                    NavigationLink(destination: EncryptionSettingsView()) {
                        Label("Encryption", systemImage: "lock.shield")
                    }
                } header: {
                    Text("Security")
                }

                // Privacy
                Section {
                    NavigationLink(destination: DataExportView()) {
                        Label("Export Data", systemImage: "square.and.arrow.up")
                    }

                    Button(role: .destructive) {
                        showDeleteAccount = true
                    } label: {
                        Label("Delete Account", systemImage: "trash")
                    }
                } header: {
                    Text("Privacy & Data")
                }

                // App info
                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundStyle(.secondary)
                    }

                    Link(destination: URL(string: "https://zeroleak.app/privacy")!) {
                        HStack {
                            Text("Privacy Policy")
                            Spacer()
                            Image(systemName: "arrow.up.right")
                                .font(.caption)
                        }
                    }

                    Link(destination: URL(string: "https://zeroleak.app/terms")!) {
                        HStack {
                            Text("Terms of Service")
                            Spacer()
                            Image(systemName: "arrow.up.right")
                                .font(.caption)
                        }
                    }
                } header: {
                    Text("About")
                }

                // Sign out
                Section {
                    Button(role: .destructive) {
                        showSignOutConfirmation = true
                    } label: {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .confirmationDialog("Sign Out?", isPresented: $showSignOutConfirmation) {
                Button("Sign Out", role: .destructive) {
                    authManager.signOut()
                }
                Button("Cancel", role: .cancel) { }
            }
            .alert("Delete Account", isPresented: $showDeleteAccount) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    // TODO: Implement account deletion
                }
            } message: {
                Text("This will permanently delete your account and all associated data. This action cannot be undone.")
            }
        }
    }
}

// MARK: - Placeholder Views

struct SubscriptionView: View {
    var body: some View {
        Text("Subscription Management")
            .navigationTitle("Premium")
    }
}

struct CustomDomainView: View {
    var body: some View {
        Text("Custom Domain Setup")
            .navigationTitle("Custom Domain")
    }
}

struct PasskeysView: View {
    var body: some View {
        Text("Manage Passkeys")
            .navigationTitle("Passkeys")
    }
}

struct EncryptionSettingsView: View {
    var body: some View {
        Text("Encryption Settings")
            .navigationTitle("Encryption")
    }
}

struct DataExportView: View {
    var body: some View {
        Text("Export Your Data")
            .navigationTitle("Data Export")
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthenticationManager())
}
