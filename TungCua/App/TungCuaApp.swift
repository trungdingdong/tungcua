import SwiftUI
import SwiftData

/// P0 routes: Home, ScanReview, OCRProgress, Reader.
enum AppRoute: Hashable {
    case home
    case scanReview(docID: UUID)
    case ocrProgress(docID: UUID)
    case reader(docID: UUID)
    case attribution
}

@main
struct TungCuaApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                HomeView()
            }
            .modelContainer(for: [ScannedDoc.self, DocPage.self])
        }
    }
}
