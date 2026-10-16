# Encrypted Firestore exports and restore rehearsal

This trusted operator tool provides a **manual Firestore-data export** and an **isolated emulator restore rehearsal**. It does not implement scheduled daily backups, production restore, Firebase Auth export/password recovery, Storage files, indexes, security rules, hosting settings or secrets. Keep those recovery requirements on the operational backlog. No real production export is created by automated tests.

Export uses application-default operator credentials and the fixed project `student-project-manageme-7efae`, default database only. The supplied active Super Admin UID attributes the export; it is not authentication. Credentials are the trusted authority and bypass client rules. The tool belongs with authorized institutional operators, not the ordinary Super Admin browser interface: exports contain private project, chat, contact and audit data. Export reads count toward the project's existing Firestore quota; the tool does not enable billing.

## Export

Prepare a private folder outside the repository. Use a unique passphrase from your password manager, at least 20 non-padding characters, and retain it separately from the backup. A lost passphrase cannot be recovered by this tool. Do not place a passphrase in source files, terminal arguments, screenshots or chat.

In PowerShell, this prompt avoids echoing the passphrase or placing its value in command history. Replace the example private path and UID with your own. Do not paste a real passphrase into the code block.

```powershell
$backupSecret = Read-Host 'Backup passphrase' -AsSecureString
try {
    $env:PROJECTTRACK_BACKUP_PASSPHRASE = [System.Net.NetworkCredential]::new('', $backupSecret).Password
    npm.cmd run backup -- export --file 'C:\private\projecttrack-2026-10-16.ptbackup' --actor SUPER_ADMIN_UID
    if ($LASTEXITCODE -ne 0) { throw 'Backup failed. Do not treat the file as a completed backup.' }
} finally {
    Remove-Item Env:\PROJECTTRACK_BACKUP_PASSPHRASE -ErrorAction SilentlyContinue
    $backupSecret.Dispose()
}
```

The process refuses emulator variables during production export, output inside the repository, existing output files, unsupported values and cross-project/named-database references. It traverses root collections, subcollections and descendants beneath missing parent documents. It retains document data and original update-time metadata, then writes only an encrypted artifact and verifies that artifact can be authenticated and parsed. No plaintext snapshot file is written. A disk or process failure can leave an incomplete encrypted file; use a new filename and inspect it before treating an export as successful.

The pilot limits are 50,000 documents, 100,000 traversed document locations and 32 MB encoded plaintext. Exceeding a limit stops the export. These are rolling reads with recorded start/end times, **not a point-in-time consistent database snapshot**. The tool does not freeze writers. Arrange a quiet institutional maintenance window for a coherent recovery copy and retain a separate known-good backup; an export taken during writes can contain different moments of project/history state. Real dataset coverage and a real restore exercise still need operator review.

Encryption uses AES-256-GCM with random salt/nonce and a scrypt-derived key (N=32768, r=8, p=1). Authentication detects wrong passphrases and ciphertext modification; it is not an independent signature proving institutional origin. Protect the passphrase, operator machine, folder ACLs and off-device backup copies. No key or backup is uploaded by this tool.

## Inspect without network access

Set the passphrase with the same secure prompt and `finally` cleanup, then run:

```powershell
npm.cmd run backup -- inspect --file 'C:\private\projecttrack-2026-10-16.ptbackup'
```

Inspection checks authentication, schema, duplicate/invalid document paths and typed values. It prints document count, source time range and rolling-read status; it does not print record contents or require Firebase credentials. An exit code other than zero means inspection failed.

## Rehearse recovery in an empty emulator

With Java and development dependencies installed, use a fresh Firestore emulator in a separate terminal:

```powershell
npx.cmd firebase emulators:start --only firestore --project demo-projecttrack-recovery
```

Set the passphrase privately in the operator terminal as above. Set `FIRESTORE_EMULATOR_HOST` to the emulator's explicit loopback address before running:

```powershell
$env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
try {
    npm.cmd run backup -- rehearse --file 'C:\private\projecttrack-2026-10-16.ptbackup'
    if ($LASTEXITCODE -ne 0) { throw 'Restore rehearsal did not pass.' }
} finally {
    Remove-Item Env:\FIRESTORE_EMULATOR_HOST -ErrorAction SilentlyContinue
}
```

Use an isolated operator machine or an emulator instance that no one else is writing to. The command accepts only project `demo-projecttrack-recovery`, default database, on `127.0.0.1:<port>`. It rejects a non-empty target, uses create-only writes and never deletes or overwrites target documents. There is no production restore mode or project override. Decryption/schema validation happens before writes. A failed rehearsal can leave committed chunks in the disposable emulator; stop and start a fresh instance before retrying. The tool does not automatically erase it.

After creating documents, rehearsal reads the entire target and compares the document set and typed values with the source artifact. References within the original default database are rebound to the emulator project. Timestamps retain their stored precision, byte fields and 64-bit integers retain their values, and maps/arrays retain their structure. The codec keeps timestamp seconds/nanoseconds as read from Firestore; [Firestore stores timestamp fields to microsecond precision and rounds down finer input](https://firebase.google.com/docs/firestore/manage-data/data-types). Restore tests compare the stored source with the restored values rather than assuming finer input was stored. Integral numeric values (including negative zero) are normalized through the Node SDK's integer representation. Original system `updateTime` values remain in the artifact as metadata; restored documents receive new system update times. Unsupported value classes fail explicitly, including cross-project references and vector values.

The CI command `npm run test:backup` creates only synthetic documents in demo emulator projects, encrypts/decrypts their snapshot, restores into the separate empty recovery project, verifies nested missing-parent history and typed values, and proves a second restore is refused. This tests the tooling, not the institution's real backup coverage, Auth recovery, deployment configuration or full disaster recovery procedure. No recurring backup automation is enabled.
