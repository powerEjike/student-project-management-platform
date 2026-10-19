# Optional conversation-open status

In a one-to-one staff chat, each participant can enable **Share my conversation-open status in this chat**. It is off by default and is independent for each person and conversation. No existing private unread or mute records are exposed or migrated. General channels and private groups do not support this feature.

Sharing publishes a message ID and its sent timestamp, showing how far the conversation has been opened. While the conversation is mounted and the browser document is visible, confirmed newer messages advance the shared position. It covers the conversation, including replies and messages hidden by a search or paging. It does not prove that every message or later edit was read or understood. A missing shared position does not mean the chat is unread. Muting still controls notices rather than this explicitly enabled sharing.

Only the two current authorized participants can get their chat's shared records. Users can create, advance or delete only their own record. Positions must refer to an existing message in that conversation, with its exact timestamp; arbitrary future or backwards positions and extra copied fields are rejected. Collection listing is denied. The UI reads the two fixed member records and waits for server-confirmed state before displaying it or automatically publishing.

Turning sharing off deletes the shared position, leaving personal unread counts and mute preferences intact. Automatic publishing reads the consent record inside a transaction and cannot recreate a missing record. If another window turns sharing off during a publish, the retry sees the missing record and stops. Re-enabling requires an explicit action. This removes the current shared position; it cannot retract information the other participant has already seen.

Read-status errors remain separate from message sending. Reopen the conversation to retry a failed verification or update. The state is not a complete historical delivery log, staff attendance measure or proof of successful student contact. No email, presence service or paid resource is enabled.
