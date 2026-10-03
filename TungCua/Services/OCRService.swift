import Foundation
import Vision
import UIKit

struct OCRLine: Sendable {
    let text: String
    let box: CGRect
    let confidence: Float
    let candidates: [String]
}

enum OCRStatus: Sendable {
    case recognized(lines: [OCRLine])
    case noText
    case failed(reason: String)
}

/// Sole OCR engine: VNRecognizeTextRequest, .accurate,
/// recognitionLanguages ["zh-Hant", "zh-Hans", "en"], no language correction
/// for Chinese. Off-main-thread, one page at a time. No network calls.
enum OCRService {
    static let languages = ["zh-Hant", "zh-Hans", "en"]
    static let lowConfidenceThreshold: Float = 0.6

    static func recognize(pageImageURL: URL) async -> OCRStatus {
        await Task.detached(priority: .userInitiated) {
            guard let image = UIImage(contentsOfFile: pageImageURL.path),
                  let cg = image.cgImage else {
                return OCRStatus.failed(reason: "Unreadable page image.")
            }
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.recognitionLanguages = languages
            request.usesLanguageCorrection = false
            do {
                try VNImageRequestHandler(cgImage: cg, options: [:]).perform([request])
            } catch {
                return OCRStatus.failed(reason: error.localizedDescription)
            }
            let lines: [OCRLine] = (request.results ?? []).flatMap { obs in
                obs.topCandidates(3).enumerated().map { idx, cand in
                    OCRLine(
                        text: cand.string,
                        box: obs.boundingBox,
                        confidence: idx == 0 ? obs.confidence : 0,
                        candidates: obs.topCandidates(3).map(\.string)
                    )
                }
            }
            return lines.isEmpty ? .noText : .recognized(lines: lines)
        }.value
    }
}
