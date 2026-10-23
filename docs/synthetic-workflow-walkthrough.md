# Synthetic workflow walkthrough — 22 October 2026

Environment: local Firestore emulator (`demo-projecttrack`). Synthetic records only. No production account, student, assignment, reply or email was created or changed.

The connected `pilot lifecycle` regression test follows one student through:

| Handoff | Verified behavior |
| --- | --- |
| Admin roster | Current academic session 2025/2026 remains separate from admission session 2022/2023. |
| Student registration | A Pending request appears in the admin queue and grants no project access. |
| Admin approval | Approval, roster email audit and exact account/access binding commit together. |
| HOD allocation | Assigned supervisor receives a private allocation notice and can read the student's name, registration and CGPA. Unassigned staff cannot read the roster student. |
| Supervisor folder | Only the primary supervisor explicitly creates the folder. |
| Topic | Archive matching runs before topic approval; approval creates the milestone plan. |
| Progress | Supervisor stage completions are visible to the HOD. |
| Published update | Verified approved student reads sanitized progress and feedback, without private milestone notes or raw project access. |
| Student reply | Reply retains the original feedback edition and is readable by the supervising staff and HOD. Admin has no private reply access. |
| Defence list | Supervisor completion adds exactly one HOD defence entry. Withdrawal removes it; renewed clearance restores it without losing progress. |
| Archive | Final completion removes pending defence eligibility, creates the archive entry and publishes Archived to the student. Allocation/topic/progress/defence/completion histories survive. |

Scope: authenticated role contexts exercise the real Firestore rules. Firebase Auth email delivery, password flows and browser navigation are not simulated by this test. Existing UI previews cover the updated forms; this report is an automated data/permission walkthrough, not a claim of a full live browser role-switching test.

Reproduce with `npm run test:rules`; the connected journey runs as part of the permission suite. CI also runs app, build and backup/restore checks.

Validation result: connected journey passed; all 235 app tests and all 62 Firestore permission tests passed locally. No product code or Firestore rules changed during this walkthrough.


## Final connected regression — 23 October 2026

The same approved synthetic roster identity now also completes attendance before any project allocation: lecturer starts class and writes QR keys atomically; unverified access is denied; the verified student checks in once and sees their collection-group history. HOD access and early report generation are denied. The test closes check-in and advances only the synthetic fixture’s start time past two hours, then generates/shares the report, derives the HOD notice, saves a private seen receipt and denies another staff member access to it. The original allocation-to-archive journey then completes unchanged.

The expanded connected case passed locally. This fixture time adjustment is not a production operation or a claim that two hours elapsed during the test. The full release CI remains the source of the final complete-suite result.
