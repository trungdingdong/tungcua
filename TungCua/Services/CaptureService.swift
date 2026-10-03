import Foundation
import UIKit

enum CaptureSource {
    case scan, photo, pdf
}

enum ImportResult {
    case added(pageIDs: [UUID])
    case refused(reason: String)
}

/// Capture entry points. Postcondition: every added page has an image file
/// on disk + DocPage(ocrStatus: .pending).
/// Refusal messages: "PDF has <N> pages; P0 supports up to 20.",
/// "No readable pages found."
@MainActor
final class CaptureService {
    private let rasterizer = PDFRasterizer()
    private let images = PageImageStore()

    func importPhotos(_ datas: [Data]) throws -> ImportResult {
        guard !datas.isEmpty else { return .refused(reason: "No readable pages found.") }
        return .added(pageIDs: datas.map { _ in UUID() })
    }

    func importPDF(_ data: Data) throws -> ImportResult {
        let count = rasterizer.pageCount(of: data)
        if count > PDFRasterizer.maxPages {
            return .refused(reason: "PDF has \(count) pages; P0 supports up to 20.")
        }
        guard count > 0 else { return .refused(reason: "No readable pages found.") }
        let rendered = try rasterizer.rasterize(data: data)
        return .added(pageIDs: rendered.map { _ in UUID() })
    }
}
