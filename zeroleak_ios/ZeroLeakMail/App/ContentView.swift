import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthenticationManager

    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainTabView()
            } else {
                SignInView()
            }
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            AliasesListView()
                .tabItem {
                    Label("Aliases", systemImage: "envelope.badge.shield.half.filled")
                }

            ReceiptsView()
                .tabItem {
                    Label("Receipts", systemImage: "receipt")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthenticationManager())
        .environmentObject(APIClient())
}
