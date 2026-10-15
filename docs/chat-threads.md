# Staff message replies

Active conversation members can reply to a message, open its thread, search within it and return to the full conversation. A reply to another reply joins the same original thread; nested trees are not created. Threads use the existing conversation membership, mute/unread settings, project-link permissions and message reporting/moderation. Super Admins and non-member HODs do not gain access to private conversations.

Messages store only an immutable `replyToId` pointing to an existing original message in the same conversation. No original body, sender name or project details are copied into a reply. Context comes from the current original message, so edits appear immediately and removed originals display a placeholder. Replies remain visible to conversation members after the original is removed, but new replies are blocked. Staff can return to the conversation to send an independent message. Sender edits and removals continue to work on existing replies; reporting is per message.

Rules reject missing targets, cross-conversation targets, self-targets, nested reply targets, copied original fields, changing a reply target and replying to an original removed in the same atomic write. Replies cannot be pinned as announcements. Existing messages without the new field remain valid originals. Sending rechecks the original in a transaction; stale or removed originals produce an error and retain the typed draft.

The pilot still subscribes to conversation history and paginates it in the interface. This is not server-side history pagination. Opening a thread retains the existing conversation-level read behaviour; it does not introduce per-thread read receipts or email delivery. Files and email alerts remain unavailable while those services are disabled.
