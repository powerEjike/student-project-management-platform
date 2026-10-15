# Document intake policy

Super Admin can configure each department's maximum original file size (whole megabytes from 1–20; 1 MB = 1,048,576 bytes), with PDF, Word (.docx), or both permitted. At least one type is required. The engine's existing 20 MB/100-page limit and Word conversion safeguards remain unchanged. No policy defaults to 20 MB and both types, after a server check confirms the policy is absent.

Every change requires a reason, a new revision and an atomic immutable history entry containing the previous settings and administrator identity. HODs and lecturers can read their current department's policy but cannot change it or read administrative policy history. Administrators cannot use policy management to read private project records.

The policy applies to new submission receipts and newly saved document-review metadata. Bulk intake validates it before parsing files and again during version checking; recording transactions read the latest policy. New-review saves also read the policy in the transaction. Firestore rules enforce the same size and filename-extension checks. This is metadata validation, not malware scanning or independently verified file content; local parsing still validates PDF/Word structure.

Existing saved reviews remain readable and can receive further annotations even when their original size/type would no longer be admitted. Existing receipts and their audited corrections are preserved. Local document opening, side-by-side comparison and exporting existing reviews remain available under engine limits. Opening a local document is not admission: saving a new review or receipt must satisfy the current policy. A converted Word PDF remains subject to the separate 20 MB conversion ceiling; the configurable intake size measures the original file.

Unknown, cached or pending policy snapshots do not authorize new bulk selection or review saves. Transactions and rules recheck authoritative settings at commit. A policy change can require staff to revalidate a prepared bulk batch; already recorded rows remain saved.

This does not enable uploads, cloud originals, attachments, billing or email. No pilot policy is changed during synthetic UI or emulator tests; Super Admin chooses the actual institutional settings.
