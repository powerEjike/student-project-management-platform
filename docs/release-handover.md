# ProjectTrack pilot build handover — 23 October 2026

Live site: [ProjectTrack](https://projecttrack-departments.web.app/). The previous Biochemistry address remains available.

## Closing checkpoint — 30 October 2026

Later approved updates added [separate department setup](departments.md), HOD roster uploads and department registration links, [audited corrections](audit-2026-10-24.md), and [screen recovery and dependency maintenance](improvements-2026-10-24.md). The Super Admin overview now shows five department configuration checks with shortcuts to the relevant department settings. These are guidance, not permission changes or a guarantee of operational readiness.

The build is ready for the [role-by-role acceptance checklist](acceptance-checklist.md). Continue with role-by-role acceptance and reported defects; further feature additions should have a specific agreed purpose. Staff onboarding still uses trusted operator tooling, and student account approval remains with the Super Admin.

## Current build scope

The agreed pilot feature set is implemented. Development moves to user acceptance and fixing reported defects, rather than adding optional features under an open-ended “proceed”. The [product direction](product-direction.md) records the accepted scope and later clarifications.

| User | Starting point | Main actions |
| --- | --- | --- |
| Super Admin | Workspace / Student approvals | Import 100–400 level rosters; configure staff; review and approve roster-matched student accounts. |
| HOD | Workspace | Allocate final-year students; inspect workloads/progress; manage defence list; open explicitly sent attendance reports from Notifications. |
| Lecturer | My students | Create/open assigned folders; check/revise topics; review local documents; update progress; publish student feedback. |
| Lecturer / HOD teaching | Class attendance | Start a two-hour class; display a short-lived classroom QR; generate the report after class; optionally Send to HOD. |
| Approved student | Student portal | Overview, Check in, Attendance history, Feedback and replies. |
| Staff | Floating message button | Department, direct and group chat. |

For the pilot cohort, current academic session is 2025/2026; admission session is 2022/2023. Other undergraduate levels are imported separately with the correct current session and level. Class attendance does not require a final-year project allocation.

## Verification and acceptance

`npm run build` and `npm test` check the application. `npm run test:rules` runs real Firestore rules against synthetic emulator data, including the connected roster-to-archive and attendance/report path. `npm run test:backup` rehearses encrypted Firestore recovery against a disposable emulator. CI runs all four.

After hosting deployment, `npm run verify:hosting` compares all three public indexes and the entry/core feature assets with the local build. Passing this check confirms deployed assets, not authenticated email/password flows or institutional acceptance.

The [synthetic walkthrough](synthetic-workflow-walkthrough.md) and [pilot readiness](pilot-readiness.md) describe evidence and boundaries. The user asked to leave the live browser walkthrough aside; no completed production role-switching walkthrough is claimed.

## Deferred by the current service decisions

- **Shared original files:** Firebase billing stays disabled. PDF/Word originals are opened locally; saved comments and receipts do not upload or back up originals. Staff must retain and hand over those files separately.
- **Automatic delivery:** No automatic email provider, scheduled reminders or chat attachments. Staff chat and HOD report notices work inside the app; prepared email drafts require manual sending.
- **Attendance identity:** One approved roster identity can check in once per class, within the short code/session window. QR or account sharing still requires lecturer spot-checks; physical presence is not guaranteed.
- **Operations:** Manual encrypted Firestore tooling is provided. A real private production backup, Auth/file/configuration coverage, recovery ownership and any future daily schedule must be arranged operationally. No scheduled production backup is claimed.
- **Out of scope:** Defence scheduling/panels/scoring and optional two-factor enrollment are not part of this delivery.

## Before wider departmental use

The designated staff should accept the workflows, confirm account owners/department assignments and replace temporary staff emails, agree original-file retention/handover, and arrange the production backup plan. Do not approve pending students or alter real allocations simply to demonstrate the software.

Report defects with the role, screen, expected action and actual error, excluding passwords and live classroom codes. New feature requests can be scheduled separately after acceptance.
