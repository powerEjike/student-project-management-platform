# Dependency security review — 19 October 2026

Two targeted npm overrides replace vulnerable transitive versions without downgrading Firebase or ExcelJS:

- `@firebase/firestore` → `@grpc/grpc-js` **1.14.6**, replacing 1.9.16. The upstream certificate-context and error-disclosure advisories identify patched release lines. The installed 1.14.6 is on the patched line. This dependency also supports Node tooling and emulator tests; its presence in an audit does not establish an exploitable browser authentication flaw.
- `firebase-tools` → `tar` **7.5.22**, replacing 6.2.1. This moves the CLI archive dependency to a patched major version, so CLI startup, permission emulator tests, backup rehearsal and Hosting deployment must be verified. The tar library is operator tooling, not an application upload endpoint.

The lockfile pins these resolutions. Do not remove the overrides until upstream dependency ranges resolve to patched versions and the replacement has been validated. Do not use `npm audit fix --force`: the audit's proposed Firebase/ExcelJS downgrades would cross major versions and are not a reviewed migration.

The npm audit changed from **29 reports (16 moderate, 12 high, 1 critical)** to **23 reports (16 moderate, 7 high, 0 critical)** after these updates. These are package reports, including dependencies affected through another package, not 29 independent application exploits. This is not a clean audit. Remaining reports include CLI/tooling dependency chains and the older uuid dependency used by ExcelJS and other packages; they require separate assessment and compatible updates.

References: [gRPC certificate-context advisory](https://github.com/advisories/GHSA-m9gg-hp2v-232j), [gRPC error disclosure](https://github.com/advisories/GHSA-f596-whhp-79r4), [tar extraction advisory](https://github.com/advisories/GHSA-34x7-hfp2-rc4v), [tar recursion advisory](https://github.com/advisories/GHSA-r292-9mhp-454m).

This change does not alter Firestore rules, staff permissions, student records, billing or enabled Firebase services.
