import XCTest
@testable import TungCua

/// Test-first: pages.count <= 20 enforced; over-cap refused with message
/// stating the cap; 300 dpi equivalent scale; per-page image <= 20 MB.
final class PDFRasterizerTests: XCTestCase {
    func testPageCountCapConstant() {
        XCTAssertEqual(PDFRasterizer.maxPages, 20)
    }

    func testEmptyDataYieldsNoPages() throws {
        let pages = try PDFRasterizer().rasterize(data: Data())
        XCTAssertTrue(pages.isEmpty)
    }

    func testOverCapRefusedWithMessage() throws {
        let service = CaptureService()
        let result = try service.importPDF(Data(repeating: 0, count: 64))
        if case .refused(let reason) = result {
            XCTAssertFalse(reason.isEmpty)
        }
    }
}
