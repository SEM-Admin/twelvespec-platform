# Creative Studio service

`handleCreative(tx, actor, action, input)` is a scoped command service. The HTTP route and worker must supply an authenticated actor and a kernel transaction. Customer and staff edits use the same project; immutable versions and proofs retain the project owner's scope when staff make edits.

Actions: `create`, `upload_asset`, `save_design_version`, `request_proof`, `approve_proof`, `request_changes`, `run_preflight`, `render_mockup`, `create_brand_kit`, `read`. `release_production_asset` is denied until an independent validation service is configured.

The canvas uses a 1000×1000 coordinate system. Layers are text, raster image references, or solid shapes with bounded coordinates. Physical placement is in millimetres. Saving a version creates immutable content and specification hashes and invalidates older pending/approved proofs. Proof approval echoes and validates both hashes and the exact current version. Approval does not authorize production.

Uploads are PNG/JPEG/WebP/PDF, 8 MiB maximum, with magic/type validation. Images are decoded under a pixel ceiling and re-encoded as safe PNG derivatives. Original bytes and derivative paths stay private in `.local/assets`; `readPrivateAsset` requires authenticated scope. Active SVG is rejected. PDFs remain quarantined without a browser preview. An upload is a usage assertion, not a verified legal license.

`processMockupJob` renders queued jobs as private, watermarked synthetic PNGs tied to the exact product, variant and version. A mockup is not a production file. The trusted worker must call this helper and reflect failures in its exception/DLQ workflow.

Preflight reports decoded raster dimensions at the declared physical design placement. A measurement does not establish the required supplier resolution. Checks distinguish `PASS`, `FAIL` and `UNVERIFIED`; required DPI and bleed remain null while no exact provider/method/material profile is verified. Generic 150/300 DPI and 3 mm bleed assumptions are not production requirements. A named preset or nonzero bleed does not verify imprint geometry. Production readiness remains `BLOCKED` because independent production validation, malware scanning, licensed fonts and actual supplier output profiles have not been configured. Browser-supplied profile or readiness flags do not satisfy these gates.
