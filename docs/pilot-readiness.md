# Pilot readiness — 23 October 2026

The agreed current pilot features are implemented. The release is ready for user acceptance; automated checks and synthetic previews do not establish institutional acceptance or a completed live role-by-role walkthrough.

| Area | Delivered | Boundary |
| --- | --- | --- |
| Super Admin | Department/staff controls, CSV/Excel roster import and reviewed corrections, student approval | Staff login provisioning uses trusted operator tooling; roster import does not create accounts. |
| HOD | Reviewed single/bulk allocation, workload, progress and defence oversight | Concurrent capacity is not reserved globally; successful partial allocations remain saved. |
| Lecturer | Compact assigned-student dashboard, explicit folder creation, archive topic check/revision, milestones and feedback | Similar topic suggestions need academic judgment; no-match is not proof of originality. |
| Student | Self-registration, approval, verification, published progress, feedback replies and focused dashboard | Only sanitized published updates and the student’s own records are visible. |
| Documents | Local PDF/Word review, saved comments, version receipts, revision comparison and annotated PDF export | Original files are not uploaded or shared across devices. Word conversion has layout/feature limits. |
| Attendance | All undergraduate levels, two-hour classes, timed rotating QR check-in, immutable receipts, histories, Excel reports and optional HOD sharing/notification | One approved roster identity per class; shared accounts/codes still require physical staff checks. HOD sees only own classes or explicitly sent reports. |
| Staff chat | Floating department/direct/group conversations, replies, unread/mute states and moderation | No attachments or automatic email/push delivery. |
| Defence/archive | Completion enters the HOD defence list; withdrawal and final archive retain history | Scheduling, panels and scoring are outside this version. |

## Release evidence

- Application build and tests, full Firestore permission tests and backup/restore emulator rehearsal run in CI.
- The connected synthetic pilot covers roster, account approval, attendance/check-in/history, two-hour report generation, HOD sharing/notice receipt, allocation, folder/topic/progress, student feedback reply and defence/archive.
- Synthetic browser previews cover dashboard navigation, mobile layout, preserved drafts and the changed controls. No production students or attendance records are used for these previews.
- Public deployment verification checks both sites’ index and referenced local build assets. It is not an authenticated live walkthrough.

## Explicitly deferred

Billing remains disabled. Shared original-file storage, chat attachments, automatic email/background schedules, optional two-factor enrollment and scheduled production backup are not delivered. Manual email drafts, local originals and trusted backup tooling do not substitute for those services.

## Operational acceptance

Before general departmental use, designated staff should accept the deployed workflows, confirm staff ownership/temporary email replacements, decide original-file handover/retention and arrange a private production backup with an appropriate recovery exercise. These operational decisions are distinct from completing the pilot feature build. The owner has asked to leave the live browser walkthrough aside; it is not claimed as completed.

Do not create or approve real student accounts, redistribute real allocations or create attendance fixtures merely to make a release check pass.
