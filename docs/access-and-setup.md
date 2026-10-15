# Staff sign-in and access

The first task implements email/password sign-in, password reset, session-only persistence, sign-out, a live approved-staff check, a responsive staff workspace and deny-by-default database rules. There is no public sign-up or role selector. Analytics is not initialized.

## Permissions

| Role | Scope | Project access |
| --- | --- | --- |
| Administrator | Staff provisioning and platform setup | None |
| HOD | Assigned department | Department projects |
| Lecturer | Assigned department | Assigned and co-supervised projects |
| Inactive / unapproved | None | None |

Co-supervisor is a project allocation, not a fourth account role. All database writes and all storage access are denied in this task; subsequent tasks must add narrowly scoped, tested operations. Changing `staff/{uid}` requires trusted admin tooling. Removing approval immediately changes rules and the live workspace listener. An Auth account alone grants no project access.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local`.
3. `npm run dev`
4. `npm run build` and `npm test`.
5. With Java installed, `npm run test:rules` verifies actual Firestore rules against a demo emulator project; it does not touch live data.

## Firebase setup

1. Enable Email/Password under Authentication > Sign-in method.
2. Create Cloud Firestore in production mode. Choose a location with the owner before creation; database location is a lasting decision.
3. Authenticate the Firebase CLI as the project owner. Run `npx firebase deploy --only firestore:rules` to deploy tested access rules.
4. Provision staff using trusted application-default credentials: `npm run staff -- staff@example.edu.ng hod "Staff Name" department-id "Department Name"`. This creates the Auth account if needed and approves its role. Deliver the staff account information through the institution's usual process. The user sets their password through Forgot password; the operator does not handle their password.
5. `npm run build`, then `npx firebase deploy --only hosting`.

No production account or deployment credentials belong in this repository. Do not grant roles by editing client-side configuration. Project registration, staff-management screens, uploads and progress dashboards are later tasks.

## Verified first delivery

- Production build and four local access-policy tests passed.
- GitHub Actions ran the build, access tests and four actual Firestore emulator tests successfully: https://github.com/powerEjike/student-project-management-platform/actions/runs/38086104953.
- Firestore rule compilation and deployment succeeded.
- Default Standard database location verified as `europe-west2` (London).
- Desktop and 390px mobile sign-in layouts inspected; blank-email reset validation verified.
- Hosting deployment verified at https://student-project-manageme-7efae.web.app.
- Initial administrator Auth account and active approval record created without setting a password. A real sign-in must be checked after the owner sets their password.

## Web configuration safeguards

The example configuration uses an API key placeholder. Real build configuration belongs in ignored `.env.local`; never copy it back into `.env.example`. A test rejects Google API keys in the example file.

Firebase browser configuration is visible in the built web app. Its API key identifies the project; approved staff records and Firestore rules enforce data access. Keep the browser key restricted to Identity Toolkit, Secure Token and Firestore, and to the two Firebase Hosting domains and local development on port 5173. Review these restrictions deliberately when adding another service or domain.

## Student records and allocation delivery
The Super Admin controls departments and existing staff roles, department assignments and active access. Staff changes and supervisor allocations require immutable audit records in the same transaction. Self-demotion and self-suspension are blocked. New Auth accounts remain a trusted provisioning operation; the browser cannot mint staff accounts.
HODs register students and allocate active lecturers only in their own department. A student identifier combines department, academic session and canonical matric number to prevent duplicates. Reallocation preserves the project folder and immediately removes the former supervisor's access. Super Admin can read and register student roster records across departments, as requested for CSV uploads. Project folders, topic history, private contacts and release evidence remain restricted to the HOD and authorised lecturers.
Pilot: Department of Biochemistry; HOD Chinasa Mirabel (temporary HOD@yopmail.com). The owner supplied a 200-student final-year Biochemistry roster for current session 2025/2026 and admission session 2022/2023. Replace temporary staff emails before institutional use. Lecturer Roland Oplekwu is provisioned.

Validation: build and five local checks passed; all 11 Firestore emulator permission tests passed in https://github.com/powerEjike/student-project-management-platform/actions/runs/38120977826. Synthetic desktop/mobile UI checks covered registration, bulk allocation, project history and staff access updates. Firestore rules and Hosting deployed on 11 October 2026. Roland Oplekwu (temporary Roland@yopmail.com) is provisioned as Biochemistry lecturer. Live sign-in and writes require the staff members to set their passwords; the operator did not set them.

## Topic decisions and milestones
The assigned primary supervisor records an approved, rejected or changes-requested topic with a title, abstract and decision note. Rejection and changes-requested decisions require a note. The HOD and co-supervisor can read the decision and progress; they cannot override them. Topic approval is final in this delivery: approved title and abstract are locked. Topic document uploads and the archive repeat check are still pending the versioned document delivery.
The Super Admin configures 1–10 named milestone stages per department and programme, with deadline offsets from topic approval. New approvals snapshot that template and create the initial milestones atomically with the decision history. Existing projects retain their plan when the template changes. The primary supervisor changes individual milestone status, due date and note with an immutable, matching history entry. Reassignment preserves that history and removes the former supervisor's access.
Editable pilot template saved: BSc Biochemistry, stages Proposal (14 days), Literature Review (28), Methodology (42), Data Collection (70), Analysis (84), Final Draft (98), Final Submission (112). These are starter offsets for the pilot, not institutional deadlines. Other programme names need their own template.
Validation: production build and seven local checks passed. All 15 actual Firestore emulator tests passed in https://github.com/powerEjike/student-project-management-platform/actions/runs/38123145038, including ten-stage saving and approval, protected history, supervisor-only changes and reassignment. Synthetic UI testing verified template saving, changes-requested decisions, approval, deadline changes, overdue flags, completion counts and HOD read-only access. No test students or topic records were saved to production. Live staff sign-in/write verification awaits user password setup. Firebase rules compiled and Hosting deployment completed on 11 October 2026.

## Historical archive delivery
HODs maintain their department's historical project metadata with atomic immutable history and withdrawal/restoration reasons. Departmental lecturers can check active archive titles. Topic approval in the browser requires a current exact-title check; it is advisory and the supervisor decides whether a match is acceptable. It ignores case, punctuation and spacing, rather than detecting plagiarism or semantic similarity. Admin browser access remains administrative.
Validation: nine local checks and sixteen Firestore permission tests passed in GitHub Actions run 38125182839. Hosting and Firestore rules deployed on 11 October 2026. File uploads remain disabled under the user's billing preference. CSV imports currently use trusted operator tooling; there is no browser CSV import form.

Imported 200 historical Biochemistry projects (2015–2025) from the owner's CSV. Every archive record and corresponding audit record was read back successfully; department count verified as 200. Supervisor and programme are marked Not recorded because those fields were absent. Source registration numbers are retained in private import provenance rather than published repository content.


## Topic-first supervisor registration
The owner requested that supervisors search a topic before entering student name and registration number. The lecturer workspace now offers this flow: matching archive titles block this registration path; no match reveals name, registration number and academic session. Programme defaults to BSc Biochemistry and level Final year for this pilot. Saving creates a student record, self-supervised project with the proposed title, and immutable allocation event atomically. It does not approve the topic or create milestones. HODs retain departmental visibility and reassignment controls; lecturers cannot capture existing students or create projects for another supervisor or department.
All 200 imported historical entries were corrected to programme Biochemistry with no supervisor field, preserving earlier audit snapshots. New archive forms request name, title and year only. Duplicate checks accommodate older imported IDs.
Validation: synthetic UI verified matching-title block, no-match student form and save feedback. GitHub run38126028032 passed nine local checks, build and seventeen Firestore permission tests, including department isolation, inactive staff, missing audit and existing-student takeover denial. Exact-title matching does not identify semantic similarity.


## ProjectTrack address
The owner requested ProjectTrack in the URL. New primary address: https://projecttrack-biochemistry.web.app (the shorter projecttrack site ID was already reserved). Both new Hosting domains were added to Firebase Auth authorized domains and the existing restricted browser key's referrer allowlist; API targets and old domains are preserved. Firebase Hosting configuration deploys the same tested app to both addresses.


## Bulk staff onboarding

Trusted administrators can preview and create batches of lecturer/HOD accounts using `npm run staff:batch`. See [bulk staff onboarding](bulk-staff-onboarding.md) for the private input format, application-default credential requirements, audit behaviour and partial-failure recovery. No automated email is sent and existing access is never overwritten.

## Similar topic detection
Topic checks now read active archive metadata within the signed-in staff member's department and rank exact matches first. Possible similar titles require at least three shared meaningful words and 65% coverage of the larger vocabulary; generic research words are excluded and words of six or more characters tolerate a single insertion, deletion or substitution. Reordered wording can match. Results are lexical similarity signals, not semantic, plagiarism or originality decisions.
In supervisor registration, exact matches block entry; similar matches show shared terms and require explicit review before student fields appear. Saving checks the archive again and invalidates review if match identities change. Formal topic approval retains its separate supervisor decision flow. No new cloud services, billing or permissions were added.
Validation: all200 source titles retrieved exactly and after word-order reversal. Eleven local tests and all seventeen Firestore permission tests passed in GitHub run38127808984. Synthetic UI verified similar-match review gate, entry after review and exact-match blocking.


## Defence clearance and HOD exports
The assigned primary supervisor can clear an approved topic for defence with an optional note. Because uploads remain disabled, a reason for proceeding without an uploaded final document is mandatory and appears in the immutable clearance history. Withdrawal requires a reason and removes the student from the HOD list. Decisions are atomic with matching audit records; HOD, co-supervisor, other lecturers and inactive staff cannot clear a student.
HODs can filter cleared students by academic session, programme, supervisor and inclusive Lagos clearance dates. PDF and Excel downloads contain student name, registration number, title, supervisor, programme, level, session and clearance date, with generation details and an HOD signature area. Export libraries load only when requested; PDFs embed licensed Noto Sans for accented names. Completion after defence and automatic archival remain a separate future delivery.
Validation: twelve local checks and eighteen Firestore permission tests passed run38128929601. Synthetic UI verified clearance adds a student, withdrawal removes them, and PDF/Excel downloads. Downloaded files were read back; a 45-student report preserved accented names and final record across multiple PDF pages. No real student was cleared by the operator. Billing and uploads remain disabled.


## Recovery after deployment
An old open tab could retain the previous app entry while its lazy-loaded staff module had been removed by a later Hosting deployment. That import error was displayed as an inability to check staff access. The reported incident was reproduced in the owner session; refreshing restored the Super Admin workspace. All three pilot staff approvals were independently verified active.
Staff module loading now detects known stale-import errors and refreshes once with a session guard; successful profile loading resets the guard. The access-error screen also offers Refresh workspace. Real permission failures do not trigger automatic reload. Thirteen local checks passed, including this distinction. No passwords, roles or database permissions changed.


## Completion after defence and automatic archive
The HOD or assigned primary supervisor can mark a cleared project completed after its defence. They enter a real completion date, an optional note, and confirm the department permits archiving its metadata. The project, immutable completion history, archive entry and immutable archive history save atomically. Archive metadata is copied from the approved title and student record; the year comes from the completion date. The source project is recorded for traceability.
Completed projects leave the upcoming defence list and retain their records. Progress, clearance and allocation changes are locked after completion. The HOD can still withdraw the archive entry with a recorded reason under the existing archive workflow. No final files are archived because uploads remain disabled.
Validation: fourteen local checks and nineteen actual Firestore permission tests passed run38130542232, including HOD and supervisor success, missing atomic records, missing archive permission confirmation, wrong author, invalid/future dates, duplicate completion and immutable audit denial. Synthetic UI verified required confirmation, completed-state feedback and removal from the upcoming list. No real project was marked completed during testing.


## Supervisor release workflow
Primary supervisors can request release with a reason and explanatory note. Pending requests retain the existing allocation and project access. A saved evidence snapshot contains the project's milestones and last recorded project update; meeting/contact evidence is explicitly unavailable and uploads remain disabled. Overdue work is not proof of student non-response.

The departmental HOD can decline, reassign to another active departmental lecturer, or withhold the project. Withheld projects cannot receive topic, progress, defence, completion or ordinary allocation changes. Reinstatement requires a reason and a supervisor. Reassignment/reinstatement retain the folder and prior history, clear the co-supervisor allocation, and record an immutable allocation event. Completion is blocked while release is pending.

Release reasons, evidence and decision history are restricted to the requesting supervisor and departmental HOD. The original supervisor can see their decision through My release requests after reassignment. New supervisors/co-supervisors receive ordinary project history but cannot read private release records; allocation events use a generic explanation. The HOD informs the student under the institution's procedure; the app sends no student notification.

Validation: 16 application tests and 21 Firestore emulator tests passed on GitHub Actions run 38132901343, including all decision outcomes, atomic history/evidence checks, withheld restrictions, cross-department/inactive-role denials and former-supervisor access. Synthetic browser checks covered withholding, reinstatement and reassignment. Production billing remains disabled.

## Meeting and contact evidence
The primary supervisor can record a dated meeting, phone call, email, WhatsApp or other contact, with an outcome of Contacted, No response or Cancelled and explanatory notes. The HOD can read these records; co-supervisors, administrators, other lecturers and other departments cannot. Current primary supervisors inherit contact history on reassignment. Completed and withheld projects cannot receive new contact records; pending release requests still permit contact.

Each entry is immutable and must atomically update a summary. Invalid/future calendar dates, blank notes, fabricated actor names, missing summaries, rewritten records and fabricated chronological summaries are rejected. Backdated records increment the record count without moving the most recent dates backwards. Only a successful meeting updates last meeting; only Contacted updates last successful contact. A No response entry updates last attempt without claiming successful contact. Correct an erroneous note with a new explanatory entry; original records and summary dates remain preserved.

New release requests capture the actual summary alongside milestone evidence, including contact record count and latest meeting, contact and attempt dates. The displayed days elapsed use the Nigerian calendar at request time. Later contact logs do not rewrite previously saved release evidence. An empty or missing history remains explicitly unknown. Records are supervisor observations, not independently verified evidence of student behaviour. Uploads remain disabled.

Validation: 18 application tests passed; the 22-case Firestore suite passed on run 38139784077. Synthetic browser checks verified an unanswered call with multiline notes appears in history and HOD evidence distinguishes two days since successful contact from one day since an attempt. No production contact records were created during validation.

## Quick progress updates
Primary supervisors can use Quick update from the project list after topic approval. It updates a selected stage's status and accepts a note up to 280 characters. An empty note preserves the existing note; a supplied note replaces it, with old values retained in progress history. The transaction preserves the latest deadline and rejects an outdated status, unchanged submissions and oversized notes. Completed/withheld projects and co-supervisors/HODs cannot use this action. Existing Firestore progress permissions are unchanged. Twenty application tests and a production build passed; synthetic UI save feedback was verified without modifying real projects.

## HOD supervisor workloads
The HOD can compare active primary and co-supervised projects, overdue primary projects, pending releases, defence readiness, completed and withheld primary projects. Counts follow academic session and programme filters. Completed/withheld projects are excluded from active counts; pending releases retain their allocation. Active lecturers with zero assignments and historical allocations outside the active directory remain visible. View projects filters the student list to both primary and co-supervised folders. Existing access rules are unchanged. The user ran all 21 application tests successfully; the production build and synthetic lecturer-select/reset screen checks passed.

## Progress freshness reminders
HOD and supervisor dashboards show needs-update and unknown-time filters with 7/14/30-day thresholds (default 14). Age uses the Nigerian calendar and the last audited topic or milestone update; allocation, contact, clearance and release decisions do not reset it. Completed, withheld and defence-cleared projects are excluded. Existing projects without tracking are unknown rather than backdated or assumed unresponsive. Tracking starts with their next topic/progress update.
Firestore rules now allow lastSupervisorUpdateAt only in existing primary-supervisor topic/progress updates and require the server request time, with the existing immutable audit. Isolated or fabricated timestamps are denied; project readership and staff roles are unchanged. Twenty-three application tests and twenty-two Firestore tests passed on CI38142243959. Synthetic UI verified threshold changes, stale filtering and unknown-time filtering. No production records were backfilled or changed, and billing remains disabled.
