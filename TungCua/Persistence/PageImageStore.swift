import Foundation
import UIKit

/// File-backed page image store under Documents/PageImages.
/// Thumbnails derived on demand, never blocking import.
final class PageImageStore {
    static let directoryName = "PageImages"
    static let maxBytesPerPage = 20 * 1024 * 1024

    private let fm = FileManager.default

    var directory: URL {
        fm.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(Self.directoryName, isDirectory: true)
    }

    func ensureDirectory() throws {
        try fm.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    @discardableResult
    func write(_ data: Data, fileName: String) throws -> String {
        try ensureDirectory()
        precondition(data.count <= Self.maxBytesPerPage, "page image exceeds 20 MB cap")
        try data.write(to: directory.appendingPathComponent(fileName))
        return fileName
    }

    func read(fileName: String) -> Data? {
        try? Data(contentsOf: directory.appendingPathComponent(fileName))
    }

    func delete(fileName: String) {
        try? fm.removeItem(at: directory.appendingPathComponent(fileName))
    }

    func thumbnail(for fileName: String, maxPixel: CGFloat = 256) -> UIImage? {
        guard let data = read(fileName: fileName),
              let image = UIImage(data: data) else { return nil }
        let scale = maxPixel / max(image.size.width, image.size.height, 1)
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: size)) }
    }
}
