import Foundation
import Combine

enum APIError: Error, LocalizedError {
    case invalidURL
    case networkError(Error)
    case decodingError(Error)
    case serverError(Int, String?)
    case unauthorized
    case notFound
    case unknownError

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .serverError(let code, let message):
            return "Server error (\(code)): \(message ?? "Unknown error")"
        case .unauthorized:
            return "Unauthorized. Please sign in again."
        case .notFound:
            return "Resource not found"
        case .unknownError:
            return "An unknown error occurred"
        }
    }
}

class APIClient: ObservableObject {
    private let baseURL: URL
    private let session: URLSession
    private var authToken: String?

    @Published var isLoading = false

    init(baseURL: String = "http://localhost:3000") {
        guard let url = URL(string: baseURL) else {
            fatalError("Invalid base URL")
        }
        self.baseURL = url
        self.session = URLSession.shared
    }

    func setAuthToken(_ token: String) {
        self.authToken = token
    }

    func clearAuthToken() {
        self.authToken = nil
    }

    // MARK: - Generic Request Method

    private func request<T: Decodable>(
        _ endpoint: String,
        method: String = "GET",
        body: Encodable? = nil,
        authenticated: Bool = true
    ) async throws -> T {
        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if authenticated, let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(body)
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.unknownError
            }

            switch httpResponse.statusCode {
            case 200...299:
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                do {
                    return try decoder.decode(T.self, from: data)
                } catch {
                    throw APIError.decodingError(error)
                }
            case 401:
                throw APIError.unauthorized
            case 404:
                throw APIError.notFound
            default:
                let message = String(data: data, encoding: .utf8)
                throw APIError.serverError(httpResponse.statusCode, message)
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }

    // MARK: - Health Check

    func healthCheck() async throws -> HealthResponse {
        try await request("/api/health", authenticated: false)
    }

    // MARK: - Alias Endpoints

    func createAlias(_ request: CreateAliasRequest) async throws -> Alias {
        try await self.request("/api/alias", method: "POST", body: request)
    }

    func fetchAliases(status: AliasStatus? = nil, limit: Int = 50, offset: Int = 0) async throws -> AliasesResponse {
        var endpoint = "/api/alias?limit=\(limit)&offset=\(offset)"
        if let status = status {
            endpoint += "&status=\(status.rawValue)"
        }
        return try await request(endpoint)
    }

    func killAlias(id: String) async throws -> Alias {
        struct KillRequest: Codable {
            let aliasId: String
        }
        return try await request("/api/alias/kill", method: "POST", body: KillRequest(aliasId: id))
    }

    // MARK: - Receipts

    func exportReceipts(format: String = "pdf", taxYear: Int? = nil) async throws -> Data {
        var endpoint = "/api/export/receipts?format=\(format)"
        if let year = taxYear {
            endpoint += "&taxYear=\(year)"
        }

        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError(500, "Export failed")
        }

        return data
    }
}

// MARK: - Response Models

struct HealthResponse: Codable {
    let status: String
    let timestamp: String
    let database: String
    let version: String?
}

struct ErrorResponse: Codable {
    let error: String
    let details: [String]?
}
