import SwiftUI

/// Scan review: retake, crop (system UI), and per-page list management
/// (add/remove/reorder) before recognition runs.
struct ScanReviewView: View {
    let docID: UUID
    @State private var scanning = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack {
            Text("Review pages before recognition.")
                .foregroundStyle(.secondary)
            Button("Scan a page") { scanning = true }
                .accessibilityLabel("Scan a page with the camera")
                .buttonStyle(.borderedProminent)
                .tint(Theme.mintPrimary)
        }
        .navigationTitle("Review")
        .background(Theme.bgBase)
        .sheet(isPresented: $scanning) {
            ScanBridge(
                onPages: { _ in scanning = false },
                onCancel: { scanning = false })
                .ignoresSafeArea()
        }
    }
}
