import XCTest
@testable import TungCua

/// Test-first: Trad<->Simp round-trip, pure function, stored text untouched.
final class TextDisplayConversionTests: XCTestCase {
    func testTraditionalSimplifiedRoundTrip() {
        let trad = TextDisplayConversion.display("简体中文", as: .traditional)
        XCTAssertEqual(trad, "簡體中文")
        let simp = TextDisplayConversion.display(trad, as: .simplified)
        XCTAssertEqual(simp, "简体中文")
    }

    func testEmptyStringStable() {
        XCTAssertEqual(TextDisplayConversion.display("", as: .simplified), "")
    }
}
