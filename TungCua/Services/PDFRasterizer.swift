import Foundation
import PDFKit
import UIKit

/// PDFKit rasterizer. 300 dpi equivalent scale, sequential pages inside an
/// autoreleasepool to bound peak memory. Pre-flight page-count check enforces
/// pages.count <= 20; per-page image <= 20 MB.
enum PDFRasterizer {
    static let maxPages = 20
    static let dpi: CGFloat = 300
    static let maxBytesPerPage = 20 * 1024 * 1024

    func pageCount(of data: Data) -> Int {
        PDFDocument(data: data)?.pageCount ?? 0
    }

    func rasterize(data: Data) throws -> [Data] {
        guard let doc = PDFDocument(data: data) else { return [] }
        precondition(doc.pageCount <= Self.maxPages, "PDF exceeds 20-page MVP cap")
        var out: [Data] = []
        for i in 0..<doc.pageCount {
            try autoreleasepool {
                guard let page = doc.page(at: i) else { return }
                let box = page.bounds(for: .mediaBox)
                let scale = Self.dpi / 72.0
                let size = CGSize(width: box.width * scale, height: box.height * scale)
                let renderer = UIGraphicsImageRenderer(size: size)
                let image = renderer.image { ctx in
                    UIColor.white.setFill()
                    ctx.fill(CGRect(origin: .zero, size: size))
                    ctx.cgContext.scaleBy(x: scale, y: scale)
                    ctx.cgContext.translateBy(x: -box.origin.x, y: -box.origin.y)
                    page.draw(with: .mediaBox, to: ctx.cgContext)
                }
                guard let jpeg = image.jpegData(compressionQuality: 0.85),
                      jpeg.count <= Self.maxBytesPerPage else { return }
                out.append(jpeg)
            }
        }
        return out
    }
}
