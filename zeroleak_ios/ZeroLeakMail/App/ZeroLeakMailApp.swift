import SwiftUI

@main
struct ZeroLeakMailApp: App {
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var apiClient = APIClient()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(apiClient)
                .task {
                    await authManager.checkAuthStatus()
                }
        }
    }
}
