# Reliability follow-up — 24 October 2026

## Screen recovery

The application root now has a React error boundary. Unexpected rendering failures, including rejected lazy component imports, display a recovery screen instead of leaving the app blank. The screen moves focus to its heading and offers a manual refresh, with a warning about unsaved text. It does not automatically reload, expose internal exception details, change account permissions or replace the existing handling of ordinary validation/network errors.

A local synthetic fixture forced a rendering exception. The recovery heading received focus, the internal sentinel error was absent from the visible page, and Refresh ProjectTrack returned the fixture to its healthy screen. The fixture was removed after verification. This boundary does not catch errors outside React rendering, such as arbitrary asynchronous callbacks; the existing action-specific handlers remain responsible for those errors.

## Development dependency maintenance

- Firebase CLI: 15.34.0 → 15.34.1.
- Compatible development-only updates: body-parser 1.20.9/2.4.0, fast-uri 3.1.9, qs 6.16.1 and undici 8.12.3.
- No runtime package versions changed. Runtime audit: zero reported advisories.
- After the updates, npm reported three moderate development-tool entries and no high or critical entries. The remaining entries share the OpenTelemetry core advisory path through Google Cloud Pub/Sub and Firebase CLI. The suggested forced Firebase CLI downgrade was not applied.

Advisory counts can change as the registry publishes or revises advisories; these results describe this follow-up check. They supersede the original audit's dependency count, not its historical findings.

No Firestore rules, Storage rules, student records, staff access or billing settings changed.
