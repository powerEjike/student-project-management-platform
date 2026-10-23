# ProjectTrack

A Biochemistry student project and class attendance platform. The current build is deployed at [ProjectTrack](https://projecttrack-biochemistry.web.app/).

## Delivered workflows

- Super Admin imports student rosters, manages staff access and approves roster-matched student accounts.
- HOD allocates final-year students to lecturers, reviews workloads and follows project progress and defence readiness.
- Lecturers create assigned students’ folders, check topics against the archive, review local PDF/Word documents, update milestones and publish student-facing feedback.
- Approved, verified students view published progress, reply to feedback and check into classes across 100–400 level.
- Lecturers run two-hour classes with short rotating QR check-in windows, generate attendance Excel reports afterwards, and optionally send them to the HOD.
- Student and lecturer attendance histories support course/date filters. Sent reports appear as HOD in-app notifications.
- Department, direct and group staff chat opens from the floating message button.
- Project completion feeds the HOD defence list; post-defence completion preserves archive and audit history.

## Delivery boundary

This is the feature-complete **current pilot scope**, not an assertion of institutional acceptance or production backup readiness. See [release handover](docs/release-handover.md), [pilot readiness](docs/pilot-readiness.md) and the authoritative [product direction](docs/product-direction.md).

Firebase billing remains disabled. Original documents stay on the reviewing device: shared cloud uploads and chat attachments are unavailable. Prepared email drafts require manual sending; there is no automatic email service or scheduled daily production backup. QR/account sharing cannot be eliminated by software alone; attendance requires staff spot-checks.

Students self-register and require administrator approval plus verified email and an active roster binding. Staff roles cannot be self-selected. Private project access stays restricted to the assigned supervisory team and departmental HOD; the Super Admin manages setup without routine project access.

## Development and validation

React, TypeScript and Vite with Firebase Authentication and Cloud Firestore. Firestore is in London (`europe-west2`).

1. Copy `.env.example` to `.env.local` and supply the registered Firebase web configuration locally. The example contains placeholders.
2. Run `npm ci`, then `npm run dev`.
3. Run `npm run build` and `npm test`.
4. With Java 21 available, run `npm run test:rules` and `npm run test:backup`.
5. After an authorized hosting deployment, run `npm run verify:hosting` to compare both public sites with the local build.

The GitHub workflow runs build, application tests, permission tests and an encrypted backup/restore rehearsal using disposable emulator data. The [connected synthetic walkthrough](docs/synthetic-workflow-walkthrough.md) records what is and is not verified.

## Operations

Firebase project: `student-project-manageme-7efae`. Hosting targets and project alias are in the local Firebase configuration. Configuration does not grant deployment access. Never commit operator credentials or service-account keys.

Use trusted operator tooling for staff onboarding and manual encrypted Firestore backup. Read [access and setup](docs/access-and-setup.md), [staff onboarding](docs/bulk-staff-onboarding.md) and [backup/recovery](docs/backup-and-recovery.md) before operational changes. Backups do not cover Auth users, local originals or hosting configuration.
