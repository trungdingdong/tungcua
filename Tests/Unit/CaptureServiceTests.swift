import XCTest
@testable import TungCua

/// Test-first: photo import adds pending pages with files on disk;
/// PDF >20 pages refused with "PDF has <N> pages; P0 supports up to 20.";
/// unreadable input yields "No readable pages found."
final class CaptureServiceTests: XCTestCase {
    func testEmptyPhotoImportRefused() throws {
        let result = try CaptureService().importPhotos([])
        guard case .refused(let reason) = result else {
            return XCTFail("expected refusal")
        }
        XCTAssertEqual(reason, "No readable pages found.")
    }

    func testPhotoImportAddsPages() throws {
        let result = try CaptureService().importPhotos([Data([0xFF])])
        guard case .added(let ids) = result else {
            return XCTFail("expected added pages")
        }
        XCTAssertEqual(ids.count, 1)
    }
}
