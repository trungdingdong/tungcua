import XCTest
@testable import TungCua

/// Test-first: Vision .accurate, recognitionLanguages ["zh-Hant", "zh-Hans",
/// "en"], noText on blank/unreadable input, failed reason passthrough,
/// confidence < 0.6 flagged as low.
final class OCRServiceTests: XCTestCase {
    func testLanguagesCoverTraditionalSimplifiedEnglish() {
        XCTAssertEqual(OCRService.languages, ["zh-Hant", "zh-Hans", "en"])
    }

    func testLowConfidenceThreshold() {
        XCTAssertEqual(OCRService.lowConfidenceThreshold, 0.6)
    }

    func testMissingFileFailsWithReason() async {
        let status = await OCRService.recognize(
            pageImageURL: URL(fileURLWithPath: "/nonexistent/page.jpg"))
        guard case .failed(let reason) = status else {
            return XCTFail("expected failure")
        }
        XCTAssertFalse(reason.isEmpty)
    }
}
