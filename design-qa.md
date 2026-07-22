# Design QA — Twilight Constellation Komari Theme

- Source visual truth: `K:\html\komari\prototype\implementation-image-bound-1920x1080-final.png`
- Implementation: `http://127.0.0.1:4174/`
- Implementation evidence: in-app Browser capture at 1920 × 1080, 1× CSS density (2026-07-22)
- Viewport/state: 1920 × 1080, overview, Singapore selected; responsive coordinate check at 1080 × 1920
- Source pixels: 1920 × 1080; implementation pixels: 1920 × 1080; no density normalization required

## Findings

- No actionable P0/P1/P2 mismatch remains.
- Fonts and typography: Inter/Noto Sans SC hierarchy, weights and wrapping match the approved prototype.
- Spacing and layout rhythm: header, hero, map, detail card and footer retain the approved proportions at 1920 × 1080.
- Colors and visual tokens: navy glass surfaces, cyan nodes and amber selection match the source palette.
- Image quality and asset fidelity: the original 1536 × 1024 generated twilight artwork is bundled without recompression and uses the same cover transform as every marker and path.
- Copy and content: approved Chinese interface copy is retained; required Komari attribution is present.
- Responsive position evidence: Singapore factory position remained `(30.2%, 64%)` in the image coordinate plane at both 1920 × 1080 and 1080 × 1920.
- Focused region: node markers and Singapore detail card were inspected at full resolution; no separate crop was necessary because labels and metrics were readable in the 1920 × 1080 capture.

## Interaction checks

- Node selection and detail state render correctly.
- Search filters visible nodes.
- Calibration mode opens and exposes drag guidance.
- Node detail card defaults to closed; clicking a marker opens it and clicking the same marker again closes it.
- The redundant top-level “节点” menu has been removed.
- Multiple servers at the same artwork coordinate are grouped behind one location marker; the marker opens a server list before the server card.
- CPU and memory use native progress charts with healthy/warning/critical colors at 65% and 85%; network throughput displays both upload and download.
- Map labels keep the location/server name and online count on one line, e.g. `Singapore, SG（2/2）`.
- The star action was removed, the detail control reduced to a compact button, and the bundled twilight asset supplies the card background.
- Positions persist by node UUID in localStorage and reset restores factory mapping.
- Production build completed successfully.
- Browser console only contained expected RPC/WebSocket connection failures because the standalone local preview has no Komari backend; no theme rendering errors were found.

## Comparison history

- Initial implementation: factory positions were changed from viewport/geographic projection to explicit artwork-relative city mappings.
- Post-fix evidence: the browser reported Singapore at `left: 30.2%; top: 64%`; the normalized position stayed stable at the 1080 × 1920 responsive check.

## Follow-up polish

- P3: add more city aliases over time for unusual custom region names.

final result: passed
