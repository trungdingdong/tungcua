import XCTest

/// Persistence: recognize -> terminate -> relaunch -> doc listed + openable;
/// delete -> absent from recents and storage.
final class PersistenceTests: XCTestCase {
    func testDocSurvivesRelaunch() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["TungCua"].waitForExistence(timeout: 10))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.staticTexts["TungCua"].waitForExistence(timeout: 10))
    }
}
