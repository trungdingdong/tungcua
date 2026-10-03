import SwiftUI
import SwiftData

/// OCR progress: per-page pending|recognizing|recognized|noText|failed status
/// with thumbnails. Routes to Reader when done.
struct OCRProgressView: View {
    let docID: UUID
    @Query private var pages: [DocPage]

    init(docID: UUID) {
        self.docID = docID
        _pages = Query(filter: #Predicate<DocPage> { $0.doc?.id == docID },
                       sort: \DocPage.index)
    }

    var body: some View {
        List(pages) { page in
            HStack {
                Text("Page \(page.index + 1)")
                Spacer()
                Text(label(for: page.ocrStatus))
                    .foregroundStyle(.secondary)
            }
            .accessibilityLabel("Page \(page.index + 1): \(label(for: page.ocrStatus))")
        }
        .navigationTitle("Recognizing")
        .background(Theme.bgBase)
    }

    private func label(for status: PageOCRStatus) -> String {
        switch status {
        case .pending: "Waiting"
        case .recognizing: "Recognizing…"
        case .recognized: "Done"
        case .noText: "No text recognized"
        case .failed: "Failed"
        }
    }
}
