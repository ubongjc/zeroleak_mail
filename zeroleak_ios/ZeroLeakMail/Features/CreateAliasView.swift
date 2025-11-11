import SwiftUI

struct CreateAliasView: View {
    @EnvironmentObject var apiClient: APIClient
    @Environment(\.dismiss) var dismiss

    @State private var merchant = ""
    @State private var customLocalPart = ""
    @State private var useCustomLocalPart = false
    @State private var enableDecoy = true
    @State private var isLoading = false
    @State private var errorMessage: String?

    let onCreated: (Alias) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Merchant Name", text: $merchant)
                        .textContentType(.organizationName)

                    Toggle("Enable Leak Detection", isOn: $enableDecoy)
                } header: {
                    Text("Basic Info")
                } footer: {
                    Text("The merchant name helps you identify where this alias is used. Leak detection uses decoy emails to alert you if your alias is shared.")
                }

                Section {
                    Toggle("Use Custom Local Part", isOn: $useCustomLocalPart)

                    if useCustomLocalPart {
                        TextField("Custom Local Part", text: $customLocalPart)
                            .textContentType(.username)
                            .autocapitalization(.none)
                            .textInputAutocapitalization(.never)

                        Text("Example: \(customLocalPart.isEmpty ? "custom-part" : customLocalPart)@mail.zeroleak.app")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } header: {
                    Text("Advanced")
                } footer: {
                    Text("By default, a random alias will be generated. You can specify a custom local part if preferred (must be lowercase letters, numbers, and hyphens).")
                }
            }
            .navigationTitle("New Alias")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        Task {
                            await createAlias()
                        }
                    }
                    .disabled(merchant.isEmpty || isLoading)
                }
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: {
                if let error = errorMessage {
                    Text(error)
                }
            }
            .overlay {
                if isLoading {
                    ZStack {
                        Color.black.opacity(0.3)
                            .ignoresSafeArea()
                        ProgressView()
                            .tint(.white)
                    }
                }
            }
        }
    }

    private func createAlias() async {
        isLoading = true

        let request = CreateAliasRequest(
            merchant: merchant,
            localPart: useCustomLocalPart && !customLocalPart.isEmpty ? customLocalPart : nil,
            domain: nil,
            enableDecoy: enableDecoy
        )

        do {
            let newAlias = try await apiClient.createAlias(request)
            await MainActor.run {
                onCreated(newAlias)
                isLoading = false
                dismiss()
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                isLoading = false
            }
        }
    }
}

#Preview {
    CreateAliasView { _ in }
        .environmentObject(APIClient())
}
