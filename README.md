# Student Project Management Platform

Working title: ProjectTrack.

A departmental platform for assigning supervisors, tracking student projects, preserving submissions and preparing defence clearance lists.

## First release

- Staff accounts and explicit role permissions for administrators, HODs, supervisors and co-supervisors.
- Student records, supervisor allocation and project folders.
- Topic registration and exact-title archive checks.
- Programme milestone templates, deadlines and quick progress updates.
- Original document uploads with immutable version history.
- Lecturer and HOD dashboards with overdue and stale-project indicators.
- Defence clearance and exportable defence lists.
- Documented supervisor release requests and HOD decisions.

## Build decisions

- Prototype PDF annotation, comment export and matching across revisions early. Uncertain matches require review.
- Defer built-in staff chat until the core workflow proves useful.
- Validate staff-only uploads with supervisors; consider secure student submission links.
- Record the date work was received separately from its upload date.
- Do not treat missing platform activity as proof of student non-responsiveness.
- Preserve original files and reject invalid uploads with actionable errors.
- Define permissions, co-supervisor powers and investigation exceptions before implementation.
- Make release priorities and acceptance criteria explicit.

## Infrastructure

Firebase project: `student-project-manageme-7efae`. Web app configuration is recorded in `.env.example` and the local Firebase project alias is in `.firebaserc`. Authentication, database, storage rules and hosting are not yet configured or deployed. These configuration files do not grant deployment access.

Before implementation, confirm tenancy, permissions, project states and the Firebase document storage and processing approach. Document conversion and annotation need an early feasibility check.

## Staff sign-in foundation

The initial app uses React, TypeScript and Vite with Firebase Authentication and Cloud Firestore. It includes staff sign-in, password reset, approved-role checks and a protected workspace. Students cannot register, and staff cannot choose or change their own role.

See [access and setup](docs/access-and-setup.md) for permissions, local preview, tests and Firebase provisioning. Copy `.env.example` to `.env.local`, run `npm install`, then `npm run dev`. Run `npm run build` and `npm test` before deployment.

## Delivery

Begin with one department. Verify permissions, interrupted uploads, failed conversions, imports, reassignment access and backup restoration. Pilot with supervisors before expanding.

