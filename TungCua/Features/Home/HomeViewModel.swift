import Foundation
import SwiftData

/// Recents wiring: fetch sorted by immutable createdAt desc, open doc in
/// Reader, delete with cascade (rows + image files, no orphans).
@MainActor
@Observable
final class HomeViewModel {
    private let store: DocumentStore
    var docs: [ScannedDoc] = []

    init(store: DocumentStore) {
        self.store = store
    }

    func reload() {
        docs = (try? store.fetchRecents()) ?? []
    }

    func delete(_ doc: ScannedDoc) {
        try? store.deleteDoc(doc)
        reload()
    }
}
