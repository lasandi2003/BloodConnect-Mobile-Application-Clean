# Firestore approval security review

## Source and scope

**Canonical complete file: `firestore.approval.rules`.** No rules are published or deployed by this work. No app screens/services, production documents, root package manifest, or lockfile are changed in this review.

The comparison baseline is the last rules pasted in this conversation (the attachment beginning `service cloud.firestore`, with role-only staff helpers and a misplaced photo match). The live published rules cannot be read from this workspace: Firebase CLI/account access is not configured. The user's report of the five remaining problems matches that pasted baseline. The earlier local `firestore.approval.rules` already addressed those five issues; it was a proposed file, not evidence that Firebase had published it. This review strengthens that file and corrects compatibility gaps found in the actual service code.

## Every change

| Area | Supplied rules / earlier proposal | Final rule behavior and reason |
| --- | --- | --- |
| Role helpers | Published baseline checks only staff role. Earlier proposal adds approval. | `hasActiveRole` checks signed-in identity, existing account, exact role, and active status. Healthcare/blood-bank helpers additionally require exact `approvalStatus == 'approved'`. Suspended and pending/rejected/missing-approval staff receive no staff privileges. |
| Legacy approval | No approval check in baseline. | Missing approval defaults to pending for access and review eligibility, never approved. Only an explicit admin decision grants access. Missing account status retains the existing legacy active default; invalid or suspended status does not grant role access. |
| User creation | Baseline allows self-created non-admin roles without approval validation. | Owner UID/document ID must match. Role is restricted to donor/requester/healthcare/bloodBank; active status and server registration timestamps are required. A creation field allowlist rejects arbitrary privilege/audit additions. |
| Staff creation | Baseline does not require pending/professional details. | Only pending staff registrations with bounded institution name, designation, and employee ID are allowed. Review markers cannot be supplied during registration. |
| Donor/requester creation | No approval required. | Remains approval-free. `approvalStatus` cannot be forged on these roles. Existing registration payload fields remain accepted. |
| Ordinary profile updates | Baseline excludes only UID/role/status; approval fields can be forged. Earlier proposal uses a denylist. | Only fullName, email, phone, photoURL, lastLoginAt, and updatedAt can change. All approval fields, role, UID, account status, professional application fields, createdAt, and unknown fields are excluded even for an ordinary admin profile update. Normal profile/login metadata writes continue working. |
| Account status | Baseline permits broad admin user updates. | Dedicated active-admin branch permits only another account's status and updatedAt, validates active/suspended, and requires server time. Ordinary users and suspended admins cannot reactivate themselves. This does not create a new UI action. |
| Approval decisions | Baseline has no dedicated restrictions. Earlier proposal allows reviewed staff pending transitions. | Only an active admin reviewing another staff account may move pending (or missing-field legacy) to approved/rejected. Target UID/role are immutable. Only the decision, matching reviewer/timestamp pair, and updatedAt can change. Reviewer must be the authenticated admin, timestamps must be server time, and contradictory opposite-decision markers are forbidden. |
| Approval transitions | No guarded workflow in baseline. | Approved/rejected accounts cannot be reviewed again through this branch. Non-staff targets, self-review, forged reviewer IDs/times, and combined role/profile changes are denied. No automatic legacy approval or role promotion. |
| User deletion | Admin deletion allowed. | Retained for other users; admin self-deletion is denied. |
| Donor profiles | Baseline permits owner/healthcare/admin reads. | Active donor owner, approved healthcare, or active admin may read. Donor-owner create/update and admin delete remain. Pending staff cannot exploit an owner read branch as a staff privilege. |
| Donor response GET | Baseline permits signed-in users whose response ID ends in their UID, including nonexistent GET. | Restricts that branch to donors. Missing-document existence checks remain allowed. Existing documents must also have the same donorId. Approved healthcare/admin document reads remain. |
| Donor response LIST | Baseline and earlier proposal omit healthcare list permission, although verificationService queries accepted/completed responses. | Adds approved healthcare list access so the actual dashboard summary query works. Active admins can list all; donors must query their own donorId. Pending healthcare and unconstrained donor list queries are denied. |
| Donor response writes | Baseline checks owner and suffix only. | Requires deterministic requestId_donorUid creation IDs, allowed creation fields, accepted/declined initial response and matching status, and server timestamps. Updates preserve owner/request/createdAt, limit mutable fields, validate known response/status values, and require server updatedAt. Withdrawal and deletion of declined/withdrawn responses remain. |
| Emergency request GET | Baseline reads allowed for any signed-in user; earlier proposal allows every requester to read all requests. | Donors, active admins, and approved staff retain collection access. Requesters read only owned records, or a nonexistent ID needed by the creation transaction's first GET. This avoids breaking `submitEmergencyRequest`. |
| Emergency request LIST | Blanket signed-in/requester collection access. | Requester queries must filter requesterId to their UID; existing History already does. Other authorized readers retain their existing collection queries. |
| Emergency request CREATE | Baseline checks requester ownership only. | Requires requester owner, pending_verification, false verification flags, valid blood/hospital/date/urgency fields, no forged cancellation metadata, and server timestamps. Existing submission service emits this schema. |
| Requester UPDATE | Earlier supplied requester edit branch already limits six fields before verification. | Retained: only owner may edit unitsRequired/hospitalName/location/requiredDate/urgency/updatedAt while unverified and in an eligible status. Patient, blood group, ownership, verification, and status remain immutable through this branch. |
| Request cancellation | Supplied baseline/earlier proposal lack permission for the current cancelEmergencyRequest service. | Adds a dedicated owner soft-cancel branch for the service's active statuses. Only status, cancelledBy, cancelledAt, and updatedAt can change; status must become cancelled, reviewer UID must be owner, and times must be server time. Request deletion remains denied. |
| Healthcare verification | Baseline checks only healthcare role. | Same restricted verified/status/updatedAt operation, but approved active healthcare is required and updatedAt must be server time. No role can use this branch to edit patient/owner/blood details. Blood-bank staff do not acquire verification privileges. |
| Donor matches | Baseline healthcare can read/create arbitrary matches. | Approved healthcare reads/create only. Creation must match deterministic requestId_donorId, matched status, the five fields emitted by confirmDonorMatches, and server timestamps. Update/delete remain denied, preserving idempotent creation. No admin match-read permission is silently added. |
| Match messages | Baseline healthcare role comparison bypasses approval helper. | Uses approved healthcare or the matched active donor. Existing matched-document/ID checks remain. Messages must use the authenticated sender/actual role, exact field set, nonempty bounded text, and server timestamp. Edit/delete remain denied. |
| Inventory | Baseline checks blood-bank role only. | Active admin or explicitly approved active blood-bank staff may read/delete. Create/update additionally validate known blood group, nonnegative integer units, and current Normal/Low Stock status strings. Existing seed/update payloads fit this schema. |
| Photo / other paths | Photo Storage match incorrectly nested in Firestore. | Omitted because photo upload was removed and Storage permissions never belong here. Unmatched collections/subcollections are denied by default; no unrestricted wildcard writes. |

## Compatibility issues to review before publishing

1. **Staff lockout is intentional:** existing healthcare/blood-bank accounts without approvalStatus lose privileged access until reviewed. Do not blanket-backfill approved. Collect missing professional details through the administrator before approving legacy accounts.
2. **Legacy user UID:** existing `users/{uid}` documents must have the correct `uid` field. UID-less/mismatched records cannot be updated/reviewed through these account branches; an administrator must correct them manually after verification.
3. **Malformed legacy audit fields:** pending records carrying contradictory approved/rejected markers must be investigated and repaired manually. The app review action does not clear forensic evidence automatically.
4. **No reapproval/revocation transition:** only pending/missing approval → approved/rejected is implemented. Approved → rejected and rejected → approved are denied. Active administrators can suspend another account for revocation; a future reapplication workflow needs separately reviewed rules/UI.
5. **Profile field allowlist:** future profile features must explicitly extend the allowed fields. Role, approval, account status, professional fields and registration date cannot be changed by ordinary users. Admin role provisioning stays a trusted Firebase Console/server task.
6. **Requester queries:** any old requester screen querying the entire emergencyRequests collection will now fail. Current Request History uses the required requesterId filter. Single-document updates/status checks are owner-scoped.
7. **Donor read privacy limitation:** donorService currently reads the entire emergencyRequests collection and filters locally, so donor-role collection reads are preserved. Firestore cannot hide selected patient/contact fields inside an otherwise readable document. A separate public donor-request projection would be needed for field-level privacy without breaking this module; this review does not invent that schema.
8. **Legacy payloads:** new request creations need the current full blood requirement schema; old incomplete documents remain readable under ownership/role rules. Response IDs, timestamps and known status values must follow current service conventions. Inventory fractional/negative units or nonstandard status strings are rejected on writes, though reads still work.
9. **Existing permission limits retained:** admin match records remain unavailable; approved healthcare now gains donorResponses list access because its existing summary query needs it. The blood-bank request-management page is currently local sample data, not a Firestore approval service. No new blood-bank request verification writes are invented.
10. **Other teammates' later changes:** compare with the actual current Console rules before publishing. Additional collections/matches added after the pasted baseline are not discoverable here; preserve them and add explicit approval checks to their staff permissions.
11. **Date semantics:** rules enforce YYYY-MM-DD format, not calendar validity or a future-date condition. Existing client validation checks those details; approval security does not depend on the date.

## Emulator security tests

The isolated test harness is `tests/firestore/approval.rules.test.cjs`. It uses `@firebase/rules-unit-testing` to execute the actual rules in the local Firestore Emulator, not mocked policy functions.

- The fixed project ID is **demo-bloodconnect-approval**, never the production project.
- It requires FIRESTORE_EMULATOR_HOST and refuses non-loopback hosts.
- It never imports `src/config/firebase.ts`.
- Fixture seeding and database clearing happen only in that local demo project.
- Firebase CLI, rules-unit-testing, and Firebase SDK versions are pinned in the test-only package manifest. Root app dependencies/lockfile remain unchanged.

From the application root, install the isolated test tooling and run:

```powershell
npm.cmd --prefix tests/firestore install --ignore-scripts
npm.cmd --prefix tests/firestore test
```

This downloads test tooling and the emulator as needed, starts the local emulator on port 8085, compiles/loads `firestore.approval.rules`, runs the tests, and stops the emulator. It does not deploy rules. Node 22+ and Java 21 are recommended; both are present on this machine, but the test dependencies/CLI are not currently installed. No packages were installed by this review.

The suite covers:

- Ordinary donor/requester registration; pending-only healthcare/blood-bank registration.
- Admin account creation, forged audit metadata, changing own role/status/UID/approval metadata, and approving another account as a non-admin: deny.
- Admin approval/rejection of pending and legacy staff: allow; wrong target role, self-review, stale transitions, false timestamps/reviewer, extra-field changes, and suspended admin: deny.
- Pending/rejected/missing-approval/suspended healthcare reads, verification, matching and messages: deny.
- Pending/rejected/missing-approval/suspended blood-bank inventory operations: deny.
- Approved healthcare profile/response reads, verification/rejection, match creation and messaging: allow.
- Approved blood-bank inventory operations: allow; malformed stock and healthcare verification by bank staff: deny.
- Requester read-before-create transaction, own History query, editing and soft-cancel: allow; cross-owner reads/writes and forged verification: deny.
- Donor profile update, response existence checks/create/owner-query/withdraw/delete, and matched-donor messages: allow; cross-owner queries/writes, unmatched messaging and message mutation: deny.
- Anonymous reads and writes to unconfigured paths: deny.

**Latest execution status:** the actual local Firestore Emulator compiled the rules and all **34 tests passed (0 failed)**. The original assertions were retained and additional checks cover deleting existing audit metadata together with a profile change and privilege changes by approved healthcare/blood-bank accounts. JavaScript syntax, app TypeScript and whitespace checks also passed. Lint remains unavailable because the root app has no lint script. This is local emulator verification, not a deployment or live Firebase test.

The two previous donor/requester failures were `{ approvalStatus: deleteField() }` applied to documents without that field. The resulting document was unchanged: `affectedKeys()` was empty, and an empty set satisfies `hasOnly(...)`. Ordinary profile updates now require both `hasOnly(editable)` and `hasAny(editable)`: at least one real allowed-field change, with no effective protected-field changes. Pure no-op profile writes are denied for all roles. Existing legitimate profile/login services send real changes or a fresh `updatedAt` server timestamp and remain permitted. Firestore evaluates before/after document data, so an absent-field deletion bundled with a legitimate change is not distinguishable from omitting that deletion; it does not remove any stored protected data.

## Manual publish procedure

1. Export/copy the actual published rules as a backup and compare them against this review's known baseline.
2. Run the emulator test suite and resolve every failed test/compile error.
3. Review the compatibility list, especially legacy staff, older user records, donor data privacy, and any extra collections.
4. Paste the reviewed contents of `firestore.approval.rules` into **Firebase Console → Firestore Database → Rules** and publish manually only when ready.
5. Test donor/requester login and requests, approved healthcare verification/matching/messages, pending/rejected staff denial, and approved blood-bank inventory with dedicated accounts.

References: [Firebase rules unit testing](https://firebase.google.com/docs/rules/unit-tests), [field restrictions and affectedKeys](https://firebase.google.com/docs/firestore/security/rules-fields), [query access requirements](https://firebase.google.com/docs/firestore/security/rules-query).
