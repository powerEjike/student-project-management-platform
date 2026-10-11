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
HODs register students and allocate active lecturers only in their own department. A student identifier combines department, academic session and canonical matric number to prevent duplicates. Reallocation preserves the project folder and immediately removes the former supervisor's access. Super Admin access is administrative; student records and project files remain restricted to the HOD and assigned lecturers.
Pilot: Department of Biochemistry; HOD Chinasa Mirabel (temporary HOD@yopmail.com). No real student records are seeded. Replace the temporary email before institutional use. Lecturer provisioning awaits the owner's chosen name and email.

Validation: build and five local checks passed; all 11 Firestore emulator permission tests passed in https://github.com/powerEjike/student-project-management-platform/actions/runs/38120977826. Synthetic desktop/mobile UI checks covered registration, bulk allocation, project history and staff access updates. Firestore rules and Hosting deployed on 11 October 2026. Roland Oplekwu (temporary Roland@yopmail.com) is provisioned as Biochemistry lecturer. Live sign-in and writes require the staff members to set their passwords; the operator did not set them.
