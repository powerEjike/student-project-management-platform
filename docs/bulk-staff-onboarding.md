# Bulk staff onboarding

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
