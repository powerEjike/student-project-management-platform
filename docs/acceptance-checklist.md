# ProjectTrack acceptance checklist — 30 October 2026

Live platform: https://projecttrack-departments.web.app/

Release `867a351` passed its build, all 249 application tests, Firestore permission tests and backup recovery rehearsal in [CI](https://github.com/powerEjike/student-project-management-platform/actions/runs/41052889921). Deployment verification covered all three hosting addresses. See the [audit](audit-2026-10-24.md) and [follow-up](improvements-2026-10-24.md) for evidence and limitations.

## Live setup checkpoint

| Department | Verified configuration | Still needed |
| --- | --- | --- |
| Biochemistry | HOD, five lecturers, BSc Biochemistry default, current session 2025/2026 and existing seven-stage template; all five setup checks pass. | Staff/user acceptance below. |
| Chemistry | Department exists. | HOD, lecturers, programme, current session and milestone template. Owner's demo-versus-real staff choice is pending. |

Biochemistry's previously missing default programme was saved to match its existing BSc Biochemistry template. Appearance defaults were preserved. No student, staff, allocation, project or attendance records changed. Configuration checks are not user acceptance.

## Role-by-role acceptance

Use a clearly labelled synthetic pilot identity for actions that save data. Do not approve real students or redistribute their allocations merely to test the software. Leave each item unchecked until the designated staff actually accept it.

- [ ] **Super Admin:** confirm department settings and staff ownership, then check that the student link selects the right department/session. Review a synthetic pending signup against its roster identity; unapproved accounts must remain locked out.
- [ ] **HOD:** review the current-session roster, allocate a synthetic final-year student, and confirm the selected lecturer receives the allocation. Check workload, supervisor progress and automatic defence-list entry after completion.
- [ ] **Lecturer:** confirm the assigned name/registration/CGPA, create a folder, check the proposed topic against the department archive, update a milestone and publish feedback.
- [ ] **Documents:** review a local PDF/Word file and save comments. Confirm that originals remain local and are not represented as cloud uploads.
- [ ] **Student:** register and await approval; after approval and email verification, view only the student's own published update and send a feedback reply. Private supervisor notes must remain private.
- [ ] **Attendance:** a student from the correct department/session checks in using the current classroom QR; the receipt appears in their history and cannot be duplicated. Attendance works for 100–400 level without project allocation.
- [ ] **Attendance report:** after the two-hour class, the lecturer generates a report and chooses whether to send it to the HOD. Closing check-in early must not bypass the duration gate. An unsent lecturer report must stay private.
- [ ] **Staff chat:** confirm a test message/reply reaches the intended department/private conversation through the floating chat control.

## Before wider use

- [ ] Replace temporary public-inbox staff identities with confirmed private staff emails.
- [ ] Assign ownership for private production backups/recovery and original PDF/Word retention. The synthetic restore rehearsal is not a running production backup plan.
- [ ] Record acceptance or defects with the role, screen, expected result and actual result. Exclude passwords and current classroom codes.

The owner previously asked to leave the live browser walkthrough aside; no full production role-switching walkthrough or institutional acceptance is claimed. This checkpoint adds no application features, Firestore/Storage rules or billing changes.
