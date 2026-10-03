import Foundation
import SwiftData

enum PageOCRStatus: String, Codable {
    case pending, recognizing, recognized, noText, failed
}

enum PageSourceKind: String, Codable {
    case scan, photo, pdf
}

/// One recognized text line. Box is 0–1 normalized to the page image.
/// Confidence 0–1 from VNRecognizedTextObservation; < 0.6 renders pink-ink
/// underline. Candidates top-3 retained for P2 correction UI.
struct RecognizedLine: Codable {
    var text: String
    var x: Double
    var y: Double
    var width: Double
    var height: Double
    var confidence: Float
    var candidates: [String]
}

/// One page within a ScannedDoc.
/// Validation: image file <= 20 MB per page; lines stored verbatim in the
/// recognized variant (Trad/Simp toggle is display-only via OpenCC, never
/// stored); lines empty unless recognized; averageConfidence nil unless
/// recognized. Transitions: pending -> recognizing -> recognized|noText|failed.
@Model
final class DocPage {
    @Attribute(.unique) var id: UUID
    var index: Int
    var imageFileName: String
    var thumbnailFileName: String?
    var sourceKind: PageSourceKind
    var ocrStatus: PageOCRStatus
    var lines: [RecognizedLine]
    var averageConfidence: Float?
    var doc: ScannedDoc?

    init(index: Int, imageFileName: String, sourceKind: PageSourceKind) {
        self.id = UUID()
        self.index = index
        self.imageFileName = imageFileName
        self.thumbnailFileName = nil
        self.sourceKind = sourceKind
        self.ocrStatus = .pending
        self.lines = []
        self.averageConfidence = nil
    }
}
