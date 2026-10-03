import SwiftUI
import SwiftData

/// P0 Reader: plain (non-tappable) recognized text. Original | Text toggle,
/// font-size slider, Trad/Simp display toggle (display-only, stored text
/// untouched). Low-confidence (< 0.6) characters get a pink-ink underline.
/// Blank pages show an explicit "no text recognized" state.
struct ReaderView: View {
    let docID: UUID
    @Query private var pages: [DocPage]
    @State private var showImage = false
    @State private var fontSize: CGFloat = 20
    @State private var variant: ScriptVariant = .traditional

    init(docID: UUID) {
        self.docID = docID
        _pages = Query(filter: #Predicate<DocPage> { $0.doc?.id == docID },
                       sort: \DocPage.index)
    }

    var body: some View {
        VStack {
            Picker("View", selection: $showImage) {
                Text("Text").tag(false)
                Text("Original").tag(true)
            }
            .pickerStyle(.segmented)
            .accessibilityLabel("Switch between recognized text and original image")
            Picker("Script", selection: $variant) {
                Text("Traditional").tag(ScriptVariant.traditional)
                Text("Simplified").tag(ScriptVariant.simplified)
            }
            .pickerStyle(.segmented)
            .accessibilityLabel("Traditional or Simplified display")
            Slider(value: $fontSize, in: 14...32, step: 1) {
                Text("Text size")
            }
            .accessibilityLabel("Text size")
            List(pages) { page in
                if page.lines.isEmpty {
                    Text("No text recognized on this page.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(page.lines, id: \.text) { line in
                        Text(TextDisplayConversion.display(line.text, as: variant))
                            .font(.system(size: fontSize))
                            .underline(line.confidence < OCRService.lowConfidenceThreshold,
                                       color: Theme.lowConfidenceUnderline)
                    }
                }
            }
        }
        .navigationTitle("Reader")
        .background(Theme.bgBase)
    }
}
