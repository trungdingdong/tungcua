import Foundation
import SwiftData

/// SwiftData-backed document store + file cleanup.
/// Postcondition: deleteDoc leaves no orphan rows or image files.
/// updateLines is idempotent per page: re-run replaces lines, never appends.
@MainActor
final class DocumentStore {
    private let context: ModelContext
    private let images: PageImageStore

    init(context: ModelContext, images: PageImageStore) {
        self.context = context
        self.images = images
    }

    func createDoc(source: CaptureSourceKind) -> ScannedDoc {
        let doc = ScannedDoc(sourceKind: source)
        context.insert(doc)
        return doc
    }

    func addPages(_ fileNames: [String], source: PageSourceKind, to doc: ScannedDoc) {
        for name in fileNames {
            let page = DocPage(index: doc.pages.count, imageFileName: name, sourceKind: source)
            page.doc = doc
            doc.pages.append(page)
        }
    }

    func updateLines(_ lines: [RecognizedLine], averageConfidence: Float?, for page: DocPage) {
        page.lines = lines
        page.averageConfidence = averageConfidence
    }

    func fetchRecents() throws -> [ScannedDoc] {
        let desc = FetchDescriptor<ScannedDoc>(sortBy: [SortDescriptor(\.createdAt, order: .reverse)])
        return try context.fetch(desc)
    }

    func deleteDoc(_ doc: ScannedDoc) throws {
        for page in doc.pages {
            images.delete(fileName: page.imageFileName)
            if let thumb = page.thumbnailFileName {
                images.delete(fileName: thumb)
            }
        }
        context.delete(doc)
    }
}
