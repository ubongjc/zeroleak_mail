import Foundation

enum AliasStatus: String, Codable {
    case active = "ACTIVE"
    case killed = "KILLED"
    case suspended = "SUSPENDED"
    case leaked = "LEAKED"
}

struct Alias: Identifiable, Codable {
    let id: String
    let email: String
    let merchant: String?
    let status: AliasStatus
    let decoyEnabled: Bool?
    let eventCount: Int?
    let receiptCount: Int?
    let createdAt: Date
    let leakedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, email, merchant, status, createdAt, leakedAt
        case decoyEnabled
        case eventCount
        case receiptCount
    }
}

struct CreateAliasRequest: Codable {
    let merchant: String
    let localPart: String?
    let domain: String?
    let enableDecoy: Bool

    init(merchant: String, localPart: String? = nil, domain: String? = nil, enableDecoy: Bool = true) {
        self.merchant = merchant
        self.localPart = localPart
        self.domain = domain
        self.enableDecoy = enableDecoy
    }
}

struct AliasesResponse: Codable {
    let aliases: [Alias]
    let pagination: Pagination
}

struct Pagination: Codable {
    let total: Int
    let limit: Int
    let offset: Int
    let hasMore: Bool
}
