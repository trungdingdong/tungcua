import SwiftUI
import SwiftData

struct HomeView: View {
    @Query(sort: \ScannedDoc.createdAt, order: .reverse) private var docs: [ScannedDoc]
    @State private var route: AppRoute?

    var body: some View {
        List {
            Section {
                NavigationLink("Scan", value: AppRoute.scanReview(docID: UUID()))
                    .accessibilityLabel("Scan a document with the camera")
                NavigationLink("Photos", value: AppRoute.home)
                    .accessibilityLabel("Import a photo from the photo library")
                NavigationLink("Files", value: AppRoute.home)
                    .accessibilityLabel("Import an image or PDF from Files")
            }
            Section("Recent documents") {
                if docs.isEmpty {
                    Text("No documents yet. Scan or import your first page.")
                        .foregroundStyle(.secondary)
                }
                ForEach(docs) { doc in
                    NavigationLink(doc.title, value: AppRoute.reader(docID: doc.id))
                        .accessibilityLabel("Open \(doc.title)")
                }
            }
            Section {
                NavigationLink("Attribution", value: AppRoute.attribution)
                    .accessibilityLabel("Open license attribution")
            }
        }
        .navigationTitle("TungCua")
        .navigationDestination(for: AppRoute.self) { route in
            switch route {
            case .home: HomeView()
            case .scanReview(let id): ScanReviewView(docID: id)
            case .ocrProgress(let id): OCRProgressView(docID: id)
            case .reader(let id): ReaderView(docID: id)
            case .attribution: AttributionView()
            }
        }
        .background(Theme.bgBase)
    }
}
