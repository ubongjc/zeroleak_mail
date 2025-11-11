import SwiftUI

struct ReceiptsView: View {
    @EnvironmentObject var apiClient: APIClient
    @State private var selectedYear: Int = Calendar.current.component(.year, from: Date())
    @State private var isExporting = false
    @State private var exportFormat: ExportFormat = .pdf
    @State private var showShareSheet = false
    @State private var exportedData: Data?
    @State private var errorMessage: String?

    private let years: [Int] = {
        let currentYear = Calendar.current.component(.year, from: Date())
        return Array((currentYear - 5)...currentYear).reversed()
    }()

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Tax year selector
                VStack(alignment: .leading, spacing: 8) {
                    Text("Tax Year")
                        .font(.headline)

                    Picker("Tax Year", selection: $selectedYear) {
                        ForEach(years, id: \.self) { year in
                            Text(String(year)).tag(year)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                .padding()

                // Export format
                VStack(alignment: .leading, spacing: 8) {
                    Text("Export Format")
                        .font(.headline)

                    Picker("Format", selection: $exportFormat) {
                        Text("PDF").tag(ExportFormat.pdf)
                        Text("CSV").tag(ExportFormat.csv)
                    }
                    .pickerStyle(.segmented)
                }
                .padding(.horizontal)

                // Export button
                Button(action: exportReceipts) {
                    if isExporting {
                        HStack {
                            ProgressView()
                                .tint(.white)
                            Text("Exporting...")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    } else {
                        Label("Export Receipts", systemImage: "square.and.arrow.up")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                }
                .disabled(isExporting)
                .padding(.horizontal)

                // Info section
                VStack(alignment: .leading, spacing: 12) {
                    InfoRow(
                        icon: "doc.text",
                        title: "Tax Documentation",
                        description: "Export all receipts for tax filing"
                    )

                    InfoRow(
                        icon: "arrow.triangle.2.circlepath",
                        title: "Return Tracking",
                        description: "Keep organized records for returns"
                    )

                    InfoRow(
                        icon: "lock.shield",
                        title: "Privacy Protected",
                        description: "All data encrypted before export"
                    )
                }
                .padding()

                Spacer()
            }
            .navigationTitle("Receipts")
            .sheet(isPresented: $showShareSheet) {
                if let data = exportedData {
                    ShareSheet(items: [data])
                }
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: {
                if let error = errorMessage {
                    Text(error)
                }
            }
        }
    }

    private func exportReceipts() {
        isExporting = true
        Task {
            do {
                let data = try await apiClient.exportReceipts(
                    format: exportFormat.rawValue,
                    taxYear: selectedYear
                )
                await MainActor.run {
                    exportedData = data
                    showShareSheet = true
                    isExporting = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isExporting = false
                }
            }
        }
    }
}

struct InfoRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.blue)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

enum ExportFormat: String {
    case pdf
    case csv
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    ReceiptsView()
        .environmentObject(APIClient())
}
