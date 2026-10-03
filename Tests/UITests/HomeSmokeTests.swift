import XCTest

/// Home smoke: launch -> Home visible with Scan / Photos / Files buttons.
/// Requires a UI Testing Bundle target (add on first Mac setup, attach files).
final class HomeSmokeTests: XCTestCase {
    func testHomeShowsEntryPoints() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["TungCua"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Scan a document with the camera"].exists)
        XCTAssertTrue(app.buttons["Import a photo from the photo library"].exists)
        XCTAssertTrue(app.buttons["Import an image or PDF from Files"].exists)
    }
}
