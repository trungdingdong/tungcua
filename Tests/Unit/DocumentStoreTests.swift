import XCTest
import SwiftData
@testable import TungCua

/// Test-first: written before DocumentStore. Must FAIL until implemented.
/// Covers: round-trip persist + delete cascade leaves no orphan rows/files.
final class DocumentStoreTests: XCTestCase {
    func testRoundTripPersistsDocWithPages() throws {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: ScannedDoc.self, DocPage.self, configurations: config)
        let store = DocumentStore(context: container.mainContext, images: PageImageStore())
        let doc = store.createDoc(source: .scan)
        store.addPages(["a.jpg", "b.jpg"], source: .scan, to: doc)
        let recents = try store.fetchRecents()
        XCTAssertEqual(recents.count, 1)
        XCTAssertEqual(recents.first?.pages.count, 2)
    }

    func testDeleteDocRemovesPagesAndFiles() throws {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: ScannedDoc.self, DocPage.self, configurations: config)
        let images = PageImageStore()
        let store = DocumentStore(context: container.mainContext, images: images)
        let doc = store.createDoc(source: .pdf)
        store.addPages(["gone.jpg"], source: .pdf, to: doc)
        try store.deleteDoc(doc)
        XCTAssertTrue((try store.fetchRecents()).isEmpty)
        XCTAssertNil(images.read(fileName: "gone.jpg"))
    }
}
