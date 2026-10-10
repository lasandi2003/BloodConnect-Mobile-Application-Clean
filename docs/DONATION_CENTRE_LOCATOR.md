# Find Nearby Donation Centres

Implemented on `feature/donation-centre-locator`, based on `dev`. The dev branch was not modified, and no merge/commit/push/deployment was performed.

## App behavior

Open the donor dashboard and tap **Find Nearby Donation Centres**. The new screen reuses DonorScreenShell, the BloodConnect COLORS, installed Ionicons, and the existing React Navigation stack.

- A focus-scoped Firestore listener queries `donationCentres` with `where('isActive', '==', true)`. Refresh/reopening reconnects the listener; saved listing changes update while connected.
- Search filters centre name or district, ignoring case and surrounding spaces.
- Tap **Use my location** to request foreground permission. No background tracking is requested. A successful fix sorts by Haversine distance, nearest first. Distances are approximate straight-line kilometres, not driving distances.
- Without permission/location, centres remain browsable and searchable, ordered by name. GPS failure/timeout does not block the listing. Permission denial explains how to enable access in device/browser settings.
- Directions opens a Google Maps URL using the saved centre coordinates. Call opens a `tel:` dialer link. A device without a supported handler receives an error, and the saved phone remains visible/selectable.
- Loading, empty/no-search-match, Firestore errors/retry, cached-data, and invalid-listing messages are handled independently from location errors.
- GPS coordinates stay in component memory, are never logged or written to Firestore, and late callbacks are ignored after leaving the screen/session.
- No production centres were seeded or invented. Listed active status is not a statement about opening hours or accepting donations. The screen asks the donor to contact the centre before visiting.

## Firebase manual setup

No donation-centre integration or rule existed in the repository before this feature. The live collection and published rules could not be inspected from this workspace; check them in the Firebase Console.

In **Firestore Database → Data**, create `donationCentres` if it does not already exist. Add documents with verified real information:

| Field | Firestore type | Meaning |
| --- | --- | --- |
| name | string | Real centre name |
| address | string | Real street/address details |
| district | string | Centre district |
| phone | string | Public centre phone, including leading zero or international + prefix |
| latitude | number | Verified latitude between -90 and 90 |
| longitude | number | Verified longitude between -180 and 180 |
| isActive | boolean | true to list the centre; false to hide it |

Coordinates must be numeric fields, not strings. Phone numbers must be strings. Invalid or incomplete records are excluded with a warning; unavailable details are never fabricated. Do not store private applicant/patient information in this donor-readable collection. Populate records through trusted Firebase Console administration; this feature does not add an app centre-management screen.

The only proposed security addition is this block, inside the existing `/databases/{database}/documents` match:

```js
match /donationCentres/{centreId} {
  allow read: if isDonor() && resource.data.isActive == true;
  allow write: if false;
}
```

`isDonor()` already exists in `firestore.approval.rules` and requires a signed-in active donor account. Add the reviewed block to your current Console rules, preserving other members' rules. The local proposed file was updated, but **nothing was published**. Firebase Console/trusted Admin SDK administration bypasses client rules; app client writes remain denied. Donor queries must include isActive == true, as this implementation does. No composite index is required under standard single-field indexing; index errors are surfaced if your project has disabled that index.

## Package and native configuration

Installed the SDK-compatible **expo-location ~57.0.20** using `npx.cmd expo install expo-location`. Package/lock files and app.json were updated. The config plugin describes foreground location access; background location remains disabled. No maps SDK or API key is needed for the external directions link.

For another checkout, install the committed dependency lockfile with `npm.cmd ci`. If manually adding the package, use `npx.cmd expo install expo-location`, not a generic npm add command.

## Expo Go test

1. Use an Expo Go version compatible with this project's Expo SDK 57.
2. Publish the reviewed read rule manually and add real active centre records with all seven fields.
3. Start with `npm.cmd start` (or `npx.cmd expo start --clear` after dependency changes).
4. Keep your phone and development computer on the same reachable network and scan the QR code with Expo Go.
5. Sign in as a donor, open the shortcut, and confirm real centre data appears.
6. Tap Use my location, allow permission, and verify distances/order. Search a real centre name and district.
7. Open Directions and Call on the physical phone. Calls are not placed automatically; the dialer opens.
8. Deny location permission and confirm the list/search still work. If already granted, reset the Expo Go/device location permission to test denial.
9. Set a test listing's isActive to false in the Console and confirm it disappears while connected. Test no matching search, empty collection, offline/cache behavior, and refresh.

Web can be checked with `npm.cmd run web`; browser geolocation requires a secure origin (localhost is supported). A desktop may not have a telephone handler. Expo Go supplies the native location module; standalone/development builds must be rebuilt to apply native config changes.

## Validation and files

TypeScript passed. Seven locator unit tests passed (Haversine edge cases, schema filtering, search/ranking, URLs, listener/query/session/error handling). All 37 actual Firestore Emulator tests passed, including three new centre-permission cases. Lint could not run: the root project has no lint script/installed ESLint. Live Firebase and physical-device GPS/phone/map behavior were not tested by the agent.

The package install reported 28 existing dependency vulnerabilities (7 moderate, 21 high). No automatic dependency repair was run.

Created:
- `src/features/donor/screens/FindDonationCentresScreen.tsx`
- `src/features/donor/services/donationCentreService.ts`
- `src/features/donor/types/donationCentre.ts`
- `src/features/donor/utils/donationCentres.ts`
- `src/features/donor/services/__tests__/donationCentre.test.cjs`
- `docs/DONATION_CENTRE_LOCATOR.md`

Modified:
- `src/features/donor/screens/DonorDashboardScreen.tsx` (shortcut/styles only)
- `src/features/donor/navigation/DonorNavigator.tsx`
- `src/features/donor/navigation/types.ts`
- `package.json`, `package-lock.json`, `app.json`
- `firestore.approval.rules` (new collection read block only)
- `tests/firestore/approval.rules.test.cjs` (three additional centre tests)

Commands:

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --test src/features/donor/services/__tests__/donationCentre.test.cjs
npm.cmd --prefix tests/firestore test
```

The emulator suite uses only the local demo project, never production Firebase.
