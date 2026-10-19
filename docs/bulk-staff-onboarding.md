# Bulk staff onboarding

Super Admins can use **Departments & staff → Prepare staff onboarding** to enter, edit and review up to 100 rows, then download the JSON input below. They can also load CSV, Excel (`.xlsx`) or a previously prepared JSON batch. All rows are shown for review. Preparation stays in the current tab; nothing is stored in Firestore or local storage. Reloading or leaving clears it. The downloaded file contains staff contact information and must be kept private. The screen does not check Authentication accounts or create access; the trusted operator still previews and applies the file using the command below.

CSV and Excel must have exactly four headings on row 1: **Staff Name**, **Email**, **Role**, **Department** (order and case may vary). Use Lecturer or HOD as the role. Department must match one current department name or exact document ID; ambiguous names must be replaced by an unambiguous ID from the screen's available-departments list. Unknown departments, Super Admin roles, duplicate emails, malformed addresses, extra columns and credential fields are rejected. Loading replaces the current prepared batch and clears its review confirmation. Existing accounts are still checked only by the operator tool.

CSV and JSON are limited to 100 KB; Excel to 2 MB. Select one visible worksheet when an Excel workbook has several. Worksheets are not combined. Use plain values without formulas, dates, linked cells, merged cells or hidden rows/columns. Workbooks with macros, external links, embedded files or excessive expansion are rejected. At most 100 staff rows and 20 worksheet columns are read; the staff table itself must have exactly the four required headings. Older `.xls` workbooks must be saved as `.xlsx` or CSV. Files are parsed locally; original files are not uploaded. Correct source errors and load the file again, or edit prepared rows through the existing form. Review every HOD appointment before downloading; no roles are inferred from names or departments.

This trusted operator command creates up to 100 lecturer/HOD Authentication accounts and approved staff records. It uses application-default administrator credentials on the operator's computer. Keep credential files and real staff input outside the repository. It does not enable billing, send emails, generate passwords, verify email ownership or grant Super Admin access.

Prepare a UTF-8 JSON file containing an array:

```json
[
  {"email":"lecturer@example.edu","displayName":"Example Lecturer","role":"lecturer","departmentId":"department-of-biochemistry"},
  {"email":"head@example.edu","displayName":"Example Head","role":"hod","departmentId":"department-of-biochemistry"}
]
```

Use the existing department document ID and an active Super Admin's Firebase Authentication UID (not email). The UID records the responsible administrator; it is not authentication. Application-default credentials are the trusted authority and must be held only by an authorized operator. This Admin SDK command bypasses client Firestore rules. HOD onboarding can create multiple HODs in a department; review the intended institution assignment before applying.

From the repository in PowerShell, preview first:

```powershell
npm.cmd run staff:batch -- 'C:\private\staff.json' --actor SUPER_ADMIN_UID
```

Review every email, name, department and role, then apply:

```powershell
npm.cmd run staff:batch -- 'C:\private\staff.json' --actor SUPER_ADMIN_UID --apply
```

The command verifies every department and checks Authentication and existing staff access before any writes. Any conflict blocks the whole batch. Existing accounts are skipped only when their staff name, role, department and active access match exactly. Disabled accounts, different roles/names/departments and Authentication accounts without staff records require separate administrator review. They are never silently adopted, renamed, re-enabled or reassigned.

Apply rechecks each row. Each new staff record and staff-access audit entry are written atomically. Authentication and Firestore cannot share one transaction: if Authentication succeeds but staff approval fails, the command stops and prints that UID as `auth-created-access-pending`. Earlier successful rows remain saved, and remaining rows are not attempted. An authorized operator must inspect and repair that UID separately. Do not delete accounts blindly or change access just to force a retry. Successful rows are safely skipped on rerun; partial accounts remain explicit conflicts.

New users set their own password through ProjectTrack's Forgot password flow. The tool sends no reset emails itself. Input and terminal output contain staff personal information; keep them private. No real pilot staff are provisioned by automated tests.
