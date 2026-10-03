import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

/// System import pickers: PhotosPicker for the photo library,
/// UIDocumentPickerViewController for images + PDF from Files.
struct LibraryPicker: View {
    var onImages: ([Data]) -> Void

    @State private var items: [PhotosPickerItem] = []

    var body: some View {
        PhotosPicker(selection: $items, matching: .images) {
            Text("Choose photos")
        }
        .accessibilityLabel("Choose photos from the library")
        .onChange(of: items) {
            Task {
                var datas: [Data] = []
                for item in items {
                    if let data = try? await item.loadTransferable(type: Data.self) {
                        datas.append(data)
                    }
                }
                onImages(datas)
            }
        }
    }
}

struct FilePicker: UIViewControllerRepresentable {
    var onURLs: ([URL]) -> Void

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(
            forOpeningContentTypes: [.image, .pdf], asCopy: true)
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: FilePicker
        init(_ parent: FilePicker) { self.parent = parent }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            parent.onURLs(urls)
        }

        func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
            parent.onURLs([])
        }
    }
}
