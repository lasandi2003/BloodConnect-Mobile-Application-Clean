# Staff approval setup and testing

Only `healthcare` and `bloodBank` require approval. `donor`, `requester`, and `admin` retain their existing login/dashboard routing. There is no new admin login and no Storage upload.

## What changed

- Staff registration requires `institutionName`, `designation`, and `employeeId` and saves `approvalStatus: 'pending'` in `users/{uid}`. Existing registration fields are retained. The same policy applies to the social-profile service.
- `StaffApprovalGate` listens to the signed-in staff account before mounting the existing staff dashboard. A missing or unknown approval status is pending. Cached approval/local pending writes do not grant access; the gate waits for server-confirmed approval. Pending/rejected users can refresh or sign out. Later approval changes update access while connected.
- Admin Dashboard has a Pending Approvals tab and overview card. The list includes pending and legacy staff accounts. It loads from the server, supports refresh, and has loading/empty/error/success states and web-compatible confirmation dialogs.
- Review transactions recheck the administrator, target role, and current application status. Decisions do not change role, patient data, or other collections. Conflicting reviews cannot overwrite each other. A retry by the same administrator for the same decision is idempotent.
- Existing AuthContext, Firebase configuration, login/logout/password-reset flows, and other members' screen/service files are unchanged. Registration/profile parsing and the two staff routing gates are the necessary authentication integration points.

## Database fields

New staff records have:

| Field | Value |
| --- | --- |
| `approvalStatus` | `pending`, later `approved` or `rejected` |
| `institutionName` | Hospital/institution or blood-bank name |
| `designation` | Professional designation |
| `employeeId` | Employee ID |
| `approvedAt`, `approvedBy` | Server timestamp and reviewing admin UID, on approval |
| `rejectedAt`, `rejectedBy` | Server timestamp and reviewing admin UID, on rejection |
| `updatedAt` | Server timestamp at review |

Registration already saves `createdAt`; that timestamp supplies the application registration date. Legacy records with missing dates/details display “Not recorded”. No migration or automatic approval is performed. Review existing staff manually before approving; their dashboard access is blocked until approved. Ensure legacy `users/{uid}` documents retain the correct `uid` field, matching the document ID, as required by existing account-update rules.

## Publish rules manually

The later security review in **`docs/FIRESTORE_SECURITY_REVIEW.md`** documents the strengthened canonical rules and actual emulator test harness. Use that review's compatibility notes and commands when publishing; its permission changes supersede the earlier summary below.

The complete proposed rules are in **`firestore.approval.rules`**. They were prepared from the last rules pasted in this conversation, not downloaded from the live project. They have **not** been published or compiled/tested against a Firebase emulator.

1. Back up your currently published Firestore rules.
2. Compare the proposed file with the current rules, especially any collection permissions teammates added after the last pasted version. Preserve those additional matches and apply staff approval checks to every healthcare/blood-bank permission. Do not blindly remove newer rules.
3. In **Firebase Console → Firestore Database → Rules**, review the proposed rules. Use the Rules Playground or your team's Firebase emulator to verify the allow/deny cases below. Confirm that Firebase accepts the syntax before publishing.
4. Publish the reviewed rules manually. No deployment command is run by this implementation.
5. Restart/reload the app and perform the account tests below. The feature is not server-secure until these rules are published.

Key rule changes:

- New staff must start pending with professional details; clients cannot register as admins or supply forged review timestamps/reviewer UIDs.
- Ordinary users cannot modify role, UID, approval fields, audit fields, registration date, or professional application details. Normal name/phone/login timestamp updates continue to work. Admins may still change account status through the non-approval update branch.
- Only an active admin reviewing another staff account may change pending/legacy approval to approved/rejected. The write must contain only the appropriate approval/audit fields plus `updatedAt`, use server time, and identify the authenticated admin.
- Both staff helper functions require **explicit** `approvalStatus == 'approved'`. Missing fields grant no staff access. Suspended staff/admins are blocked from their privileged permissions.
- The healthcare branch of match-message access uses the approved-staff helper rather than a raw role check.
- Emergency-request reads no longer use a blanket signed-in condition that would permit pending staff; existing donor/requester/admin and approved staff reads are retained. Requester creation/editing and healthcare verification retain their previous field restrictions.
- Donor profiles/responses, matching, messaging, and blood-inventory rules retain their supplied permissions, with approval added wherever healthcare/blood-bank privileges apply. Existing match rules do not grant admin access to match records; the admin Matches section may still show a permissions message.
- The accidentally pasted photo Storage match is omitted. Profile-photo upload was previously removed; no Storage rules are involved.

## Run locally

```powershell
npm.cmd run web -- --clear
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --test src/features/auth/services/__tests__/staffApproval.test.cjs src/features/inventoryAdmin/services/__tests__/adminOverviewService.test.cjs src/features/emergencyRequest/services/__tests__/emergencyRequestService.test.cjs
```

Use `npm.cmd start` and Expo Go for mobile testing. No new packages were installed. ESLint is not installed, so lint cannot run without adding tooling.

## Manual acceptance tests

Use dedicated test accounts. Log in through the existing login page. Your admin account must already be provisioned with `role: 'admin'` and active status; public registration does not create administrators.

| Scenario | Expected result |
| --- | --- |
| Register donor | Existing donor dashboard; no approval fields required |
| Register requester | Existing requester dashboard; create/history flow still works |
| Register healthcare staff | Professional details required; `approvalStatus: pending`; Awaiting Approval screen |
| Register blood-bank staff | Professional details required; `approvalStatus: pending`; Awaiting Approval screen |
| Sign in as admin → Pending Approvals | Both applications visible with professional details and date |
| Approve healthcare application | Confirmation shown; decision/audit fields saved; healthcare dashboard enabled when connected |
| Approve blood-bank application | Confirmation shown; decision/audit fields saved; blood-bank dashboard enabled when connected |
| Reject another staff application | Rejection/audit fields saved; applicant sees Application Rejected and cannot open staff dashboard |
| Existing staff without approval field | Awaiting Approval; application listed as legacy; no automatic approval |
| Concurrent admin review | First decision wins; second opposing decision reports already reviewed |
| Offline approval check | Cached approved data alone does not mount privileged staff dashboard |
| Ordinary user calls review service | Denied before writing |

Rules Playground/emulator tests must additionally verify:

- Non-admin tries direct update `approvalStatus: approved`, forged `approvedBy`, or role changes: **deny**.
- New staff tries to create an approved user document or spoof approval audit metadata: **deny**.
- Admin approves/rejects pending staff with server timestamps and only the allowed fields: **allow**.
- Pending/rejected/legacy healthcare tries to verify an emergency request or access donor matching/messages: **deny**.
- Approved healthcare performs the existing verification/matching/message workflow: **allow according to existing collection rules**.
- Pending/rejected/legacy blood-bank user reads/writes blood inventory: **deny**.
- Approved blood-bank user uses existing blood-inventory operations: **allow**.
- Donor owns/updates their profile/responses and requester creates/reads/edits their request: **existing allowed operations remain allowed**.
- Pending users may still read their own `users/{uid}` profile and update allowed ordinary fields/login timestamps: **allow**.

Local validation: TypeScript passed, whitespace checks passed, and all 58 tests passed across approval, admin overview, and emergency request services. `npm.cmd run lint` could not run because the project has no lint script or installed ESLint.

Automated tests use mocked Firebase operations. They verify registration/login policy, legacy handling, decision transactions, session/role checks, conflicting review protection, and listener/cache behavior. They do not prove deployed security-rule behavior or live Firebase success. No live approval tests were performed by the agent.
