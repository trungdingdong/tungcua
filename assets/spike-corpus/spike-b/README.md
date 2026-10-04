# PDF Corpus (Spike B)

Add PDF test fixtures here with corresponding entries in manifest.json.
Each PDF should have:
- filename
- type: text-simplified, text-traditional, scanned, mixed, 20-page, 25-page, large-pages, password-protected, corrupted, garbage-text-layer
- ground truth text per page (for text-layer PDFs)
- expectedBehavior: text-layer, render-ocr, refuse, error