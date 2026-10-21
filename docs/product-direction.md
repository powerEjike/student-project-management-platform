# Product direction — user clarification, 20 October 2026

This clarification takes precedence over broader features inferred from the requirements document.

The main workflow is:

1. Admin imports final-year student records, including registration number and CGPA.
2. HOD assigns students to department lecturers, individually or as a reviewed distribution.
3. The supervisor receives an allocation notification and sees their students' names, registration numbers and CGPAs.
4. The supervisor explicitly creates each student's folder.
5. The supervisor enters the agreed topic. Archive matching runs while entering it; an exact match blocks saving. A revised topic is checked again and preserves existing progress.
6. The supervisor reviews submitted soft copies and updates project stages. The HOD sees those updates.
7. Completed work feeds the existing defence list; final completion and archive history remain available separately.

Keep the HOD dashboard focused on Students, Progress and Defence. Keep the supervisor dashboard focused on assigned students and folder actions. Attendance/contact history is presented only to the HOD. The archive supports topic checking behind the scenes; do not display archive management or browsing on either main dashboard.

Use short labels and concise instructions. Do not add policy panels, compliance explanations, digests, audit feeds, workflow guides or speculative features to the normal task screens. Existing records are retained; hiding the old screens is not deletion of their data.

Allocation uses an internal project record for access and routing. The new folder-created timestamp records the supervisor's explicit folder action; allocation alone no longer presents an opened folder. Existing topics, milestones and completed folders remain accessible without backfilling or recreating them.

Shared original-file storage remains disabled under the user's billing decision. The Documents tab supports local PDF/Word review and saved comments/receipt metadata; it does not claim that the original file is uploaded or available on another device.

Rules changes allow only the current primary supervisor to create a folder once and revise an active approved topic with an immutable topic audit. Topic revisions cannot change allocation, milestone status/deadlines, defence readiness or final completion. Existing role and department boundaries remain.

Bulk allocation improvement: the HOD can select all filtered unassigned students, select participating lecturers, and optionally set each lecturer’s maximum total active primary workload for this proposal. Blank means unlimited; zero prevents new allocations without altering existing students. An insufficient or invalid limit blocks the whole proposal. The paged preview includes registration numbers and CGPAs, plus current/new/total workload. Limits and displayed student details are part of the review fingerprint and fresh server preflight. These are proposal limits, not department-wide capacity reservations: concurrent allocations after preflight are not locked globally. Existing per-student transactions still prevent overwriting a competing initial allocation; partial failures retain completed assignments and require a fresh proposal for remaining students. No Firestore rules changes.

Staff chat opens from a floating bottom-right message button for HODs and lecturers. The unread badge remains available across workspace pages. Opening the panel leaves the workspace mounted; minimizing preserves the selected conversation and unsent draft in memory. Minimized chat does not mark incoming messages as read. Project links minimize the panel and open the authorized folder. The panel is responsive, supports Escape/minimize and restores launcher focus. Existing department/private-chat access and message rules are unchanged.

Staff chat search: filter existing authorized conversations by colleague/group names, and search active department colleagues when starting one-to-one or group conversations. Group selections remain visible and selected across searches, with a clear-selection action and existing seven-colleague maximum. Search does not grant additional directory or message access.

Student portal (project records are read-only): students create their own Firebase Auth account using the email recorded on the roster and verify that email. Super Admin enables/disables that email in Students → Student portal access. Each email is bound to one roster identity; existing bindings cannot be moved to another student. A changed roster email immediately invalidates the old address’s portal data access. No live accounts or invitations are created as part of development.

The supervisor uses Topic & progress → Publish student update to share a snapshot of the current supervisor, topic, status and sanitized stages, plus deliberately written student-facing feedback. This is a reviewed publication, not automatic sharing of private staff feedback. The portal shows its publication time; later staff changes appear only after publishing another update. Milestone notes, decision notes, abstracts, attendance, staff chat and full project documents are excluded. Separate studentPortalAccess/studentPortalViews rules permit only verified linked students to get their own published view; no listing of all student views or editing of published data. Staff project permissions remain unchanged. Shared file uploads remain unavailable while billing is disabled.

Student self-registration now requires an administrator decision. Signup collects the student’s name, registration number, current academic session and department, creates a Pending studentAccountRequests document under that authenticated UID, and sends email verification. Existing accounts without a request can submit one from the portal. No request or verified email alone grants project access. The Super Admin sees a live in-app pending-request notice on every administration page and a Student approvals section; automatic administrator email delivery is not configured.

Approval matches registration key and current session to an existing roster entry. The administrator explicitly confirms identity and the account email. Approval atomically records the decision, links studentPortalAccess to that exact request UID, and corrects the roster contact email with the existing immutable email-history record when needed. A request cannot change or approve itself. Rejection preserves the submitted details and gives the student the decision note, with no project access. Approved access can be disabled/restored by the administrator; creating a new account does not inherit another UID’s approval. All student project reads still require email verification and the approved UID/email/roster linkage. Private staff data remains excluded. These changes supersede the earlier pre-enablement workflow; each new signup is reviewed through the request queue.

Student replies to published feedback: approved students with verified emails can send a reply of up to 2,000 characters to the current published supervisor feedback. Each immutable reply keeps the student UID/name, message, original published feedback text and exact publication timestamp. Students can read their own reply history; currently authorized supervisors/co-supervisors and the HOD can read it in the student folder. Former supervisors, unrelated staff, administrators without project access and disabled student accounts cannot read these replies. Students do not gain access to private staff feedback or project editing.

Replies appear under My replies in the student portal and Student replies in Topic & progress. If a newer update arrives while composing, the draft is preserved but sending pauses until the student reviews the new feedback. The write transaction and Firestore rules also reject stale feedback editions. Reply history retains the old feedback context after later publications. No file attachments or automatic email delivery are added.

HOD overview: quick views show department-wide totals across all sessions for unassigned students, awaiting folders, overdue projects and defence-ready students. Quick views reset list filters; defence opens the existing defence list. Student and progress lists combine session, supervisor, lifecycle status and name/registration/topic/supervisor search. Overdue counts each active project once, excludes completed stages and uses Nigerian calendar dates. No new permissions or record writes are introduced.
