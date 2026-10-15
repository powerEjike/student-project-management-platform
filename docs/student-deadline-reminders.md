# Student deadline reminder drafts

The current primary supervisor can prepare a student reminder from an active approved project's recorded milestones. Completed, defence-cleared, withheld and pending-release projects are excluded, as are invalid/unknown stage dates or statuses. Only unfinished stages are selectable. Past recorded deadlines are selected initially; otherwise the earliest valid unfinished stage is selected. Staff can choose upcoming stages too.

Loading fetches the project, student, own staff record and department from the server, then reads the project again before checking assignment and scope. Before download, the same details are fetched and compared with the draft context, including the Lagos calendar date. Changed allocation, recipient roster, topic, stage status or deadline requires reloading and rebuilding. These read checks do not lock the project against changes after export.

The composer includes the student's name, project title, chosen stage names/deadlines and supervisor/department signature. Internal progress notes, contact evidence, release reasons and other students' details are omitted. The wording asks for current progress or corrections to the record; overdue data is not treated as proof of non-response.

Staff review/edit the recipient, subject and body, then explicitly confirm before downloading an `.eml` draft. Changing a field clears confirmation. A missing roster email can be entered locally; editing it does not change the roster or independently verify ownership. Input permits one address, rejects header injection and multiple recipients, and uses a plain-text MIME body with UTF-8/base64 encoding and folded encoded subject headers. No sender account is preselected.

The email file uses `X-Unsent: 1` to request draft behaviour in compatible email apps. Support varies: staff must open/import it, check their sending account and recipient, then send manually. Downloading never sends an email, proves delivery or writes a successful-contact record. Record actual contact outcomes separately. Keep downloaded drafts private.

No Firestore rules, external email provider, scheduled delivery, billing or Auth accounts are changed. This is a manual reminder handoff, not completion of provider-based student email delivery (FR-75).
