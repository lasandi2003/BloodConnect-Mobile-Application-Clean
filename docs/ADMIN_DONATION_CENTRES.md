# Admin donation centre management

## Confirmed opening hours

Admins can add/edit optional `openingHours` text (up to 500 characters), for example confirmed weekday/weekend schedules. The donor card displays the saved schedule with a clock icon. Blank/missing hours show “Call to confirm opening hours”. No automatic “open now” or donation availability claim is made. Existing records need no migration. Clear the field to remove a displayed schedule; status toggles preserve it. Manually publish the updated complete `firestore.approval.rules` before saving hours; the schema now permits the original seven fields plus this optional string, writable only by active admins. Test adding, editing, clearing and deactivating a centre with hours, and viewing a legacy centre without hours as a donor.

Sign in with an existing active admin account. Open **Manage Donation Centres** on the Admin Dashboard (or the **Manage Centres** tab).

The screen reads all `donationCentres` records, searches name/district, and adds or edits the seven listing fields: `name`, `address`, `district`, `phone`, numeric `latitude` and `longitude`, and boolean `isActive`. Coordinates must be within ±90/±180; phone numbers contain 6–15 digits with optional international prefix and formatting. Use real, verified public listing information only. Active is listing visibility, not a claim of current donation availability.

Deactivate requires confirmation and retains the document. Activation restores donor visibility. Saves use an online transaction, verify the active admin account, and reject conflicting edits; reopen the editor if another administrator changed the record. Failed saves keep the form. New document IDs are retained for retries to avoid duplicate submissions.

## Manual Firebase setup

Review and manually publish the **complete** root `firestore.approval.rules` file in the same Firebase project's Firestore Rules console. Nothing was deployed by this implementation. The existing `isAdmin()` helper requires role `admin` and active account status; existing legacy missing status follows that helper's active default. Do not promote users through self-registration.

No new collection, index or migration is required. The optional map picker dependency is described below. Existing donor rules remain restricted to active listings; admin reads are unrestricted only within this collection. Creates and updates require exactly the seven public fields and validated values. Existing records with extra metadata must be reviewed before editing: the proposed strict schema rejects extra fields rather than exposing private metadata or deleting it automatically. Records are never permanently deleted through the app. Other collections' rules remain unchanged.

## Test

### Map picker

The Add/Edit form includes **Select Location on Map**. Tap the exact location or drag the pin, then choose **Use This Location** to fill latitude and longitude (six decimal places). Back to Form or Android Back cancels the map selection. Manual entry remains editable and uses the existing validation. A new map opens on a Sri Lanka overview without selecting a centre automatically; existing valid coordinates open with a pin.

The picker uses Leaflet 1.9.4 from a pinned CDN and public OpenStreetMap tiles, requiring an internet connection but no paid API key. Attribution is visible; only public centre coordinates enter the isolated map document, not account/contact data. Map loading failures/timeouts offer manual entry. Public OSM tiles are best-effort and subject to their usage policy; native requests identify BloodConnect, and normal browser/WebView caching is retained. No geocoding or device-location permission is required.

`react-native-webview` 13.16.1 was installed with the Expo SDK 57 installer and is included in Expo Go. Web uses a sandboxed iframe instead of the native module. Existing custom native builds need rebuilding after this dependency addition; Expo Go needs a Metro restart. No Firestore schema/rules changes are required for map selection.

Test on Expo Go and web: add a centre, select a point, confirm coordinates fill both inputs, cancel another selection and verify previous coordinates remain, edit an existing centre and adjust its pin, and disconnect internet to verify manual entry remains available. Component tests: `node --test src/features/inventoryAdmin/components/__tests__/centreMap.test.cjs`.

1. Start with `npx.cmd expo start` and open the app with Expo Go (or press `w` for web). Sign in with an active admin account.
2. Add a real centre, check required-field/phone/coordinate messages, and save valid coordinates (zero is valid). Search by name and district, edit details, and confirm persistence after reopening.
3. With a donor account on another session/device, open Find Nearby Donation Centres. Active centres should appear automatically while focused or when reopened/refreshed.
4. Cancel a deactivation confirmation: the centre should remain active. Confirm deactivation: it remains in admin management but disappears from donor results. Activate again and verify donor visibility returns.
5. Edit an active centre and turn its Active switch off: saving must also require confirmation. Check denied/offline errors and retained input. With two admin sessions, edit the same centre and verify the stale edit is rejected.
6. Local emulator tests use only `demo-bloodconnect-approval`: `npm.cmd --prefix tests/firestore test`. Unit tests: `node --test src/features/inventoryAdmin/services/__tests__/adminDonationCentre.test.cjs src/features/donor/services/__tests__/donationCentre.test.cjs`. Typecheck: `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
