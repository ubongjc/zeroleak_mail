import SwiftUI

struct AliasesListView: View {
    @EnvironmentObject var apiClient: APIClient
    @State private var aliases: [Alias] = []
    @State private var isLoading = false
    @State private var showCreateSheet = false
    @State private var errorMessage: String?
    @State private var selectedStatus: AliasStatus?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && aliases.isEmpty {
                    ProgressView("Loading aliases...")
                } else if aliases.isEmpty {
                    emptyStateView
                } else {
                    aliasesList
                }
            }
            .navigationTitle("Aliases")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { showCreateSheet = true }) {
                        Image(systemName: "plus")
                    }
                }
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        Picker("Filter", selection: $selectedStatus) {
                            Text("All").tag(nil as AliasStatus?)
                            Text("Active").tag(AliasStatus.active as AliasStatus?)
                            Text("Killed").tag(AliasStatus.killed as AliasStatus?)
                            Text("Leaked").tag(AliasStatus.leaked as AliasStatus?)
                        }
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .refreshable {
                await loadAliases()
            }
            .sheet(isPresented: $showCreateSheet) {
                CreateAliasView { alias in
                    aliases.insert(alias, at: 0)
                }
                .environmentObject(apiClient)
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: {
                if let error = errorMessage {
                    Text(error)
                }
            }
            .task {
                await loadAliases()
            }
            .onChange(of: selectedStatus) { _, _ in
                Task {
                    await loadAliases()
                }
            }
        }
    }

    private var aliasesList: some View {
        List {
            ForEach(aliases) { alias in
                AliasRowView(alias: alias, onKill: {
                    await killAlias(alias)
                })
            }
        }
    }

    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "envelope.badge.shield.half.filled")
                .font(.system(size: 64))
                .foregroundStyle(.secondary)

            Text("No Aliases Yet")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Create your first email alias to get started")
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button(action: { showCreateSheet = true }) {
                Label("Create Alias", systemImage: "plus")
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
        }
        .padding()
    }

    private func loadAliases() async {
        isLoading = true
        do {
            let response = try await apiClient.fetchAliases(status: selectedStatus)
            await MainActor.run {
                self.aliases = response.aliases
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    private func killAlias(_ alias: Alias) async {
        do {
            let killed = try await apiClient.killAlias(id: alias.id)
            await MainActor.run {
                if let index = aliases.firstIndex(where: { $0.id == killed.id }) {
                    aliases[index] = killed
                }
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct AliasRowView: View {
    let alias: Alias
    let onKill: () async -> Void

    @State private var showKillConfirmation = false
    @State private var copied = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(alias.email)
                        .font(.body)
                        .fontWeight(.medium)

                    if let merchant = alias.merchant {
                        Text(merchant)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                statusBadge
            }

            HStack {
                if let eventCount = alias.eventCount {
                    Label("\(eventCount)", systemImage: "envelope")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if let receiptCount = alias.receiptCount {
                    Label("\(receiptCount)", systemImage: "receipt")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Button(action: copyEmail) {
                    Label(copied ? "Copied" : "Copy", systemImage: copied ? "checkmark" : "doc.on.doc")
                        .font(.caption)
                }
                .buttonStyle(.borderless)
            }
        }
        .padding(.vertical, 4)
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            if alias.status == .active {
                Button(role: .destructive) {
                    showKillConfirmation = true
                } label: {
                    Label("Kill", systemImage: "xmark.shield")
                }
            }
        }
        .confirmationDialog("Kill Alias?", isPresented: $showKillConfirmation) {
            Button("Kill Alias", role: .destructive) {
                Task {
                    await onKill()
                }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This will permanently deactivate \(alias.email). This action cannot be undone.")
        }
    }

    private var statusBadge: some View {
        Text(alias.status.rawValue)
            .font(.caption)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.2))
            .foregroundColor(statusColor)
            .cornerRadius(8)
    }

    private var statusColor: Color {
        switch alias.status {
        case .active:
            return .green
        case .killed:
            return .gray
        case .leaked:
            return .red
        case .suspended:
            return .orange
        }
    }

    private func copyEmail() {
        UIPasteboard.general.string = alias.email
        copied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            copied = false
        }
    }
}

#Preview {
    AliasesListView()
        .environmentObject(APIClient())
}
