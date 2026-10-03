import SwiftUI

/// Placeholder attribution screen. Lists CC-CEDICT (CC BY-SA 4.0),
/// MakeMeAHanzi/hanzi-writer (Arphic), and the Vietnamese corpus source
/// once curated. Full texts in TungCua/Resources/LICENSES/.
struct AttributionView: View {
    var body: some View {
        List {
            Section("Dictionary") {
                Text("CC-CEDICT (CC BY-SA 4.0) — English glosses + pinyin. Ships in P1.")
            }
            Section("Readings") {
                Text("Unihan kVietnamese / kMandarin — Han-Viet readings, radicals. Ships in P1.")
            }
            Section("Stroke order") {
                Text("MakeMeAHanzi / hanzi-writer data (Arphic Public License). Ships in P1/P2.")
            }
            Section("Vietnamese glosses") {
                Text("Source under curation — see Vietnamese-Corpus-PLACEHOLDER.txt.")
            }
        }
        .navigationTitle("Attribution")
        .background(Theme.bgAlt)
    }
}
