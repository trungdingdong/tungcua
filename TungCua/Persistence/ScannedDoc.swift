import Foundation
import SwiftData

enum CaptureSourceKind: String, Codable {
    case scan, photo, pdf, mixed
}

enum DocStatus: String, Codable {
    case importing, ready, recognizing, recognized, partial, failed
}

/// A single capture session (scan batch, photo set, or one PDF import).
/// Validation: pages.count <= 20; status == .recognized only when every page
/// is .recognized or .noText (any .failed -> .partial/.failed).
/// State transitions: importing -> ready -> recognizing ->
/// recognized | partial | failed. Re-run allowed from partial/failed.
@Model
final class ScannedDoc {
    @Attribute(.unique) var id: UUID
    var createdAt: Date
    var title: String
    var sourceKind: CaptureSourceKind
    var status: DocStatus
    @Relationship(deleteRule: .cascade, inverse: \DocPage.doc)
    var pages: [DocPage]

    /// Derived. Equals pages.count. 1–20 enforced at import.
    var pageCount: Int { pages.count }

    init(sourceKind: CaptureSourceKind) {
        self.id = UUID()
        self.createdAt = Date()
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd HH:mm"
        self.title = "Document \(fmt.string(from: createdAt))"
        self.sourceKind = sourceKind
        self.status = .importing
        self.pages = []
    }
}
