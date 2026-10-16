# Student roster import

Super Admin opens **Student records → Upload student roster**. Choose the department, current academic session, admission session, programme and level. For the pilot these sessions are **2025/2026** and **2022/2023**, respectively; they are separate fields and are never inferred from registration numbers.

Use CSV or `.xlsx` up to 2 MB with 1–1,000 students. The first row must contain `Student Name` and `Reg Number`. Optional columns are `Email`, `Current CGPA` (0–5) and `Gender`. Column names are case-insensitive and must be unique. Blank email cells remain unrecorded; supplied addresses must contain one valid address. Importing an email does not send a message or create a student account.

For Excel, use plain text registration cells, including leading zeros. Numeric registration cells are rejected because original zeros may already have been lost. Choose one visible worksheet when several exist; worksheets are never combined. Formulas, dates, linked cells, merged cells and hidden rows/columns in the selected table must be removed or converted to reviewed plain values first. Use at most 20 columns and remove unused formatted rows beyond the limit. Macro, embedded-file, external-link and excessively expanded workbooks are rejected. Older `.xls` files must be saved as `.xlsx` or CSV.

Review every row through preview search and 25-row pagination. Search does not narrow the import. Confirm the identities, email addresses and cohort details to enable import. Changing the file, worksheet or cohort settings requires renewed confirmation. Correct errors in the source file and select it again. Files are parsed locally; the original file is not uploaded or retained by ProjectTrack.

Import uses the existing department/session/normalized-registration identity. Existing records are skipped, including their details, email and supervisor allocation. To correct an existing email, use the audited student email editor. New records receive supplied email addresses, or an empty email when omitted. The HOD allocates supervisors after import.

The existing transaction batches retain completed work if a later batch fails. Progress reports added/skipped counts. Re-review and retry the same cohort/file to skip existing records. The import is not an all-or-nothing transaction and does not promise a pre-import database duplicate count. No Firestore rules or access roles change in this update.
