# Pilot readiness — 19 October 2026

The core staff workflows are implemented. Automated checks are evidence for their tested paths; they do not replace an authenticated staff walkthrough or institution approval for live use.

## Implemented workflow chain

| Workflow | Implemented behavior | Important boundary |
| --- | --- | --- |
| Super Admin setup | Departments, staff access, reviewed CSV/Excel batch preparation and student roster import | Browser staff batch preparation does not itself create login accounts; trusted operator provisioning is separate. |
| HOD allocation | Individual and reviewed balanced first allocation, workloads, co-supervision, audited reassignment | Balanced proposals use primary workload, not inferred expertise. Partial batch results must be reviewed. |
| Topic approval | Archive exact-repeat check, conservative similar-title suggestions, supervisor decision, department milestone template | Similarity is not a plagiarism finding; a missing match is not proof of originality. |
| Supervision | Milestone progress/deadlines, meetings and contact evidence, ethics and structured feedback | Contact attempts and successful exchanges remain distinct. Missing activity is unknown, not proof of non-response. |
| Draft review | Local PDF/Word review, annotations, version metadata receipts, revision comparison, annotated and examiner PDF exports | Original files are not stored in shared cloud storage. Metadata receipts are not file backups. |
| Department oversight | Progress/submission/feedback views, workload and session summaries, release decisions and audit history | A generated current snapshot is not a historical session-end reconstruction. |
| Defence and archive | Supervisor completion enters the eligible student in the HOD defence list; withdrawal removes them; post-defence completion records the date and consent-confirmed archive metadata atomically | Readiness and final completion are separate. Scheduling, panels and scoring are outside this version. |
| Staff communication | Department/direct/group chat, threads, project links, private unread/mute state, optional direct-chat open positions, routed reporting and audited moderation | Sharing defaults off. An opened position is not proof a message was read. Reports do not grant general private-chat access. |
| Student email preparation | Reviewed reminder and annotated-feedback email drafts for manual sending | Download does not send email or prove delivery; no automatic provider or scheduler is connected. |

## Automated verification

The GitHub validation workflow builds the app, runs application tests and Firestore permission tests, then rehearses encrypted backup recovery against a disposable demo emulator. The synthetic pilot lifecycle test connects roster creation, allocation, topic approval, milestone updates, defence clearance, withdrawal, renewed clearance and final archive creation. It checks the HOD queue and retained audit records throughout.

These tests use synthetic emulator records. They do not modify production student records, sign in as real staff, send email or constitute an actual production backup.

## Remaining before a real departmental pilot

- Walk through the deployed UI with the institution's designated Super Admin, HOD and lecturer accounts: roster review, allocation, topic approval, draft review, defence withdrawal/re-clearance and final completion. Use clearly identified pilot fixtures and an agreed cleanup process. This has not yet been completed end to end.
- Confirm the temporary staff email addresses and each person's actual department assignment before handing over accounts. Staff set their own passwords through the approved reset process.
- Agree how original drafts are retained and handed between supervisors while cloud storage is disabled. Reassignment transfers application history, not local files between computers.
- Arrange a real private operator backup and a recovery exercise covering the required operational scope. Existing Firestore tooling does not back up Auth users, original files, hosting configuration or rules. There is no scheduled daily production backup.
- Decide separately whether to enable cloud originals/attachments, an email provider and background scheduling, or optional two-factor enrollment. They remain unimplemented or unconnected; billing stays disabled unless the owner explicitly changes that decision.

Continue fixing verified gaps in existing workflows. Do not describe guidance pages, additional exports or passing tests as completion of the remaining infrastructure and operational work.
