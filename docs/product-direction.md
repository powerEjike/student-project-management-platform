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
