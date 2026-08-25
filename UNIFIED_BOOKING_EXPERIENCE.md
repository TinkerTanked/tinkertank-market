# Unified Booking Experience

Status: implementation-ready product and technical specification

Applies to: Camps, Birthdays and Ignite

Primary outcome: every product follows the same trusted, low-friction journey while retaining only the selection fields unique to that product.

## Decisions

- The booking parent is the emergency contact by default.
- Returning families can retrieve saved family details with a passwordless email verification code.
- Guest booking remains the default and never requires account creation.
- School is optional for Camps; eligibility depends on age, not school attendance.
- Date of birth replaces age. Age is derived for the date of the booked activity.
- Stripe-hosted Checkout remains the payment surface.
- Medical and allergy information is sensitive. It must not be sent to analytics or retained in browser storage.

## Success criteria

The redesign is successful when:

1. Camps, Birthdays and Ignite use the same shell, progress treatment, navigation, child form, contact form, review and Stripe handoff.
2. A parent enters their name, email and phone once per order, regardless of the number of children or products.
3. The booking parent is used as the emergency contact unless the parent explicitly supplies an order-level or per-child alternative.
4. A returning parent can verify their email and select saved children without a password.
5. A guest can complete the same booking without verifying an email or creating a profile.
6. Every child has a first name, last name and date of birth before payment; school may be supplied optionally.
7. Product price, dates, times, location and recurring billing terms remain visible before payment.
8. Refreshes, back navigation, Stripe cancellation and recoverable failures do not silently discard a booking.
9. Availability is checked before Stripe and enforced atomically when payment completes.
10. No child name, school, date of birth, health information or emergency contact is sent to Plausible, Meta or Stripe metadata.

## Target journey

```text
Product page
    |
    v
1. Choose experience (product-specific)
    |
    v
2. Who is coming? (shared)
    |
    v
3. Your details (shared)
    |
    v
4. Review and pay (shared)
    |
    v
Stripe-hosted Checkout
    |
    v
Confirmation (shared)
```

The shared shell owns layout, navigation, validation, draft recovery, progress, summary and analytics. Each product owns a small selection component and server-side selection validation. Do not build one configurable component containing every product rule.

## Entry and shell

### Entry

Every primary `Book` CTA opens a dedicated booking route rather than a modal-only journey:

- `/book/camps?location=neutral-bay`
- `/book/birthdays?product=coding-party`
- `/book/ignite?session=<session-id>`

The query string may contain non-sensitive selection context only. Names, contact details, schools and health details must never appear in a URL.

### Shared shell

Desktop:

- Main step content on the left.
- Sticky booking summary on the right.
- Current step, completed steps and remaining steps are visible.

Mobile:

- Compact `Step n of 4` indicator and progress bar.
- Collapsible summary immediately below the page title.
- Sticky bottom action area containing Back and Continue.
- Content must not be obscured by the safe area or mobile keyboard.

Shared behaviour:

- Browser Back moves to the previous step before leaving the booking.
- Completed steps can be edited without clearing later valid answers.
- Closing or navigating away after data entry asks for confirmation.
- Validation runs on blur and on Continue. Focus moves to the first invalid field.
- Do not disable Continue without explaining why; permit submission and show actionable inline errors.
- A network failure preserves the entered data and offers Retry.
- Show `No account required` and `Secure payment through Stripe` without decorative security badges or false urgency.

## Screen specifications

### 1. Choose experience

Shared title pattern:

- Eyebrow: `Book with TinkerTank`
- Heading: product-specific
- Supporting text: one sentence explaining what must be selected
- Summary: selection and total update immediately

#### Camps

Heading: `Choose your camp`

Fields:

1. Location — required
2. Camp dates — one or more required
3. Camp format — required

Requirements:

- Show available, limited and sold-out states based on live capacity.
- Selecting multiple dates must show each date and the complete total.
- Changing location revalidates selected dates and clearly identifies any removed dates.
- The Continue label is `Continue — add children`.

#### Birthdays

Heading: `Choose your party`

Fields:

1. Party product — already selected when entering from a product page; editable
2. Venue — TinkerTank or customer venue
3. Customer venue label and street address — required only for customer venue
4. Date — required
5. Available start time — required

Requirements:

- The time list uses live global birthday availability.
- Display duration, maximum guests and full package price before Continue.
- Clarify that the child entered on the next screen is the birthday child, not every guest.
- The Continue label is `Continue — birthday child`.

#### Ignite

Heading: `Choose your weekly session`

Fields:

1. Program/session — required

Requirements:

- Show location, weekday, start/end time, first session date and weekly per-child price.
- State `Billed weekly until cancelled` next to the price, not only at Stripe.
- The Continue label is `Continue — add children`.

### 2. Who is coming?

Heading: `Who is coming?`

Supporting text: `Add each child attending this booking. You can review everything before payment.`

#### Returning-family option

Guest entry remains visually primary. Above the first child card, show a secondary disclosure:

> Booked with us before? Use saved family details

When selected:

1. Ask for email only.
2. Button: `Email me a code`.
3. Always respond with neutral wording: `If we found a matching family, a code is on its way.`
4. Ask for the six-digit code with paste and browser one-time-code autofill support.
5. On success, show saved child cards with Select and Edit actions.
6. Prefill the contact screen from the verified family profile.
7. `Continue as guest` remains available throughout.

Verification requirements:

- Code expires after 10 minutes.
- Code is single-use, hashed at rest and limited by email, IP and attempt count.
- Successful verification creates an HttpOnly, Secure, SameSite=Lax short-lived family session.
- Do not reveal whether an email exists before verification.
- Do not use passwords.

#### Child card

Fields for every product:

| Field                                    | Requirement     | Behaviour                                                      |
| ---------------------------------------- | --------------- | -------------------------------------------------------------- |
| First name                               | Required        | Plain text; saved profiles provide reuse                       |
| Last name                                | Required        | Plain text; saved profiles provide reuse                       |
| Date of birth                            | Required        | Validate as a real past date; derive age on the activity date  |
| School                                   | Optional        | Searchable text input with suggestions and typed-value support |
| Allergies or dietary requirements?       | Required Yes/No | Reveal details only when Yes                                   |
| Medical, accessibility or support needs? | Required Yes/No | Reveal details only when Yes                                   |

School behaviour:

- Never force selection from a stale fixed list.
- Suggest known schools while permitting a typed value or no value.
- Include explicit options for `Home educated` and `Not currently attending`.
- Save one school value on the child profile and copy a snapshot to the booking.

Health/support copy:

> We ask so our team can safely support your child. Only staff who need this information can access it.

Health details must never be retained in `localStorage`. Saving them to a family profile requires a separate, explicit opt-in such as `Save these support details for future bookings`. Without that consent, retain them only on the booking participant record.

Actions:

- `Add another child`
- `Remove child` with confirmation when the card contains data
- Camp and Ignite totals update per child.
- Birthday price does not multiply by the birthday child.

### 3. Your details

Heading: `Your details`

Supporting text: `We will send confirmation and important booking updates here.`

Booking parent fields, once per order:

| Field      | Requirement | Notes                                                             |
| ---------- | ----------- | ----------------------------------------------------------------- |
| First name | Required    | Do not use a single ambiguous full-name field                     |
| Last name  | Required    |                                                                   |
| Email      | Required    | Trim and lowercase for matching; preserve display safely          |
| Mobile     | Required    | Accept Australian-friendly formatting and store a normalized form |

Use the verified profile values when available. Guest values should support browser autofill.

#### Emergency contact

Default checked control:

> Use my details as the emergency contact

When unchecked, reveal:

- Emergency contact first and last name — required
- Emergency contact mobile — required
- Relationship to child — optional unless operations confirms it is required

The selected emergency contact applies to all children in this order. When an order contains multiple children, provide a secondary `Use a different emergency contact for a child` disclosure. It reveals an override only for the selected child and does not duplicate fields by default. This supports blended and shared-care families without burdening the common case.

### 4. Review and pay

Heading: `Review and pay`

The screen must answer, without opening another page:

- What was booked?
- For which children?
- When and where is it?
- What does it cost now?
- Is the amount one-time or recurring?
- Who receives confirmation and emergency calls?
- What are the relevant cancellation terms?

Sections:

1. Experience — product, location, dates/time or recurrence; Edit link
2. Children — names, DOB and school when supplied; health status shown as `Details supplied` rather than exposing sensitive text in the general summary; Edit link
3. Contact — parent and emergency contact; Edit link
4. Price — line items, discounts if introduced, complete AUD total and recurring terms
5. Terms — concise links to cancellation, privacy and terms

Use passive agreement copy rather than another checkbox unless legal advice requires affirmative consent:

> By continuing, you agree to TinkerTank's booking terms and privacy policy.

Primary action:

- One-time products: `Pay $X securely`
- Ignite: `Start subscription — $X/week`

Before creating a Stripe session, the server must validate the canonical request, server-owned prices, availability and product rules. Never trust client product names, prices, capacity or Stripe price IDs.

### 5. Stripe Checkout

Retain Stripe-hosted Checkout and configure:

- AUD currency
- Dynamic payment methods appropriate to Australia
- Apple Pay and Google Pay where eligible
- Stripe Link
- Customer email prefilled
- TinkerTank branding and support details
- Exact product description and quantity
- Clear recurring interval for Ignite

Do not place child names, DOB, school, health details or emergency details in Stripe metadata. Stripe receives only stable internal IDs needed to fulfil payment.

On Stripe cancellation, return to the Review and pay screen with:

> Payment was cancelled. Nothing was charged and your booking details are still here.

On a recoverable payment failure, preserve the draft and permit another attempt without creating duplicate orders.

### 6. Confirmation

Heading: `You are booked`

Show:

- Order number and payment status
- Product, child, date/time, location and amount
- Recurring billing details for Ignite
- Calendar action where meaningful
- Directions for venue-based bookings
- What to bring and arrival instructions
- `Book another experience` as secondary, never before confirmation details

The success page must poll only when webhook processing is genuinely pending. It must distinguish payment success from fulfilment failure and provide a support path with the order number.

## Canonical application model

Use a discriminated selection union and shared order-level contact/participant models. Product-specific data must not leak into shared child or contact records.

```ts
type ProductKind = 'camp' | 'birthday' | 'ignite'

interface PersonName {
  firstName: string
  lastName: string
}

interface BookingContact extends PersonName {
  email: string
  mobile: string
}

interface EmergencyContact extends PersonName {
  mobile: string
  relationship?: string
}

interface ChildDetails extends PersonName {
  childProfileId?: string
  dateOfBirth: string // YYYY-MM-DD local calendar date
  school: string
  emergencyContactOverride?: EmergencyContact
  allergies: {
    hasDetails: boolean
    details?: string
  }
  supportNeeds: {
    hasDetails: boolean
    details?: string
  }
  saveSensitiveDetails?: boolean
}

interface CampSelection {
  kind: 'camp'
  productId: string
  locationId: string
  dates: string[] // YYYY-MM-DD
}

interface BirthdaySelection {
  kind: 'birthday'
  productId: string
  venue: { kind: 'tinkertank'; locationId: string } | { kind: 'customer'; label: string; address: string }
  date: string // YYYY-MM-DD
  startTime: string // HH:mm in location timezone
}

interface IgniteSelection {
  kind: 'ignite'
  sessionId: string
}

type BookingSelection = CampSelection | BirthdaySelection | IgniteSelection

interface BookingDraft {
  version: 1
  selection: BookingSelection
  children: ChildDetails[]
  contact: BookingContact
  emergencyContact: { sameAsBookingContact: true } | { sameAsBookingContact: false; contact: EmergencyContact }
}
```

Rules:

- `age` is never accepted from the client as source data; derive it from DOB and activity date.
- Price, location capacity, session schedule, Stripe price and product status are resolved server-side.
- Email and mobile are order-level, not duplicated onto every child.
- Emergency details default at order level. An optional child override is copied only to that child's participant snapshot.
- The request and response schema must be shared between client and server rather than duplicated ad hoc.

## Persistence model

Historical bookings must remain snapshots. Editing a saved child later must not rewrite an old booking.

### Family

- `id`
- created/updated timestamps

Do not use one email address as the identity of an entire family. A family can have multiple verified parents or guardians, and a contact may change email without changing the children's identity.

### FamilyContact

- `id`
- `familyId`
- normalized unique email
- parent/guardian first and last name
- mobile
- last verified timestamp
- created/updated timestamps

Email verification resolves a FamilyContact and grants access to that contact's family. Adding another contact to a family must require verification and an authenticated family session; never join families by matching names, phone numbers or child details.

### ChildProfile

- `id`
- `familyId`
- first and last name
- birthdate
- school
- optional consented reusable health/support details
- sensitive-details consent timestamp
- created/updated timestamps

### Order changes

Add durable snapshots currently missing from the order:

- customer first and last name, or preserve `customerName` during migration
- customer phone
- emergency contact name and phone
- optional family ID and family contact ID
- booking draft/schema version

### Student/participant snapshot changes

Retain Student as the historical participant attached to a booking and add where needed:

- first and last name while preserving the existing combined `name` during migration
- optional child profile ID
- exact DOB
- school snapshot
- allergy/dietary snapshot
- medical/accessibility/support snapshot
- details-confirmed timestamp

Do not deduplicate historical Student rows by matching a child's name. Link only through a verified family selection or a newly created profile.

### Verification challenge

Store only:

- normalized email
- hashed code
- expiry
- attempt count
- consumed timestamp
- rate-limit metadata

Delete expired challenges on a routine schedule. Never log the code or email body.

The app already sends transactional email through AWS SES. Reuse that infrastructure by extracting a narrow shared SES sender; do not add a second email provider solely for verification codes.

Create or update reusable family details only after a successful booking, or when a verified parent explicitly saves changes. Do not create permanent family and child profiles from abandoned guest drafts.

## Draft storage and privacy

The current persisted cart can contain names and medical information in browser `localStorage`. The unified flow must replace that behaviour.

- Non-sensitive selection data may be kept in `sessionStorage` to survive refreshes.
- Contact, child and health data should remain in memory or a short-lived opaque server draft.
- If server drafts are used, store an opaque random draft ID in an HttpOnly cookie and expire abandoned drafts.
- Clear browser and server draft data after confirmed fulfilment.
- Never include sensitive fields in client logs, server logs, URLs, analytics or error monitoring breadcrumbs.

## Availability and payment integrity

The UI is advisory; the server is authoritative.

1. Fetch live availability during selection.
2. Revalidate when leaving the selection step.
3. Revalidate immediately before creating Stripe Checkout.
4. Enforce capacity/slot rules atomically during fulfilment.
5. Preserve the existing automatic refund safety net for an unavoidable race.

Best target experience: create an expiring server-side hold before redirecting to Stripe.

- Birthday: hold the unique start time.
- Camp: hold the required places per location/date.
- Hold duration should match a realistic Stripe completion window and be shown honestly.
- A completed payment consumes the hold; cancellation or expiry releases it.
- Do not display a countdown until holds are real and reliable.

## Analytics specification

Use first-party Plausible events for funnel analysis. Meta receives only the commerce events needed for advertising measurement.

| Event                        | When                           | Safe properties                                  |
| ---------------------------- | ------------------------------ | ------------------------------------------------ |
| `booking_started`            | Dedicated booking route begins | product kind, product ID, source                 |
| `booking_step_viewed`        | Step becomes active            | product kind, step name, step number             |
| `booking_step_completed`     | Valid Continue                 | product kind, step name, child count, date count |
| `booking_validation_error`   | Submission has errors          | product kind, step name, field key, error code   |
| `family_retrieval_started`   | Verification requested         | product kind only                                |
| `family_retrieval_completed` | Verification succeeds          | product kind, saved child count                  |
| `begin_checkout`             | Review is complete             | product IDs, kind, value, currency               |
| `add_payment_info`           | Stripe redirect starts         | product IDs, value, currency                     |
| `payment_cancelled`          | Stripe returns cancelled       | product kind                                     |
| `purchase`                   | Confirmed fulfilment           | order ID, product IDs, value, currency           |

Never send parent/child names, email, phone, DOB, school, address, health information or free-form text. Analytics failure must never block booking.

Track funnel completion by product and device. Establish a baseline before each product migration and compare:

- booking start to selection completion
- selection to child completion
- child completion to review
- review to Stripe redirect
- Stripe redirect to confirmed purchase
- validation errors by field key
- cancellation return and successful retry

## Accessibility and content requirements

- Meet WCAG 2.2 AA contrast and keyboard behaviour.
- Use a real page heading and ordered step list.
- Every input has a persistent visible label, description and programmatic error association.
- Announce step changes, totals and availability changes without moving focus unexpectedly.
- Date selection is fully keyboard accessible and has a non-calendar alternative where needed.
- Touch targets are at least 44 by 44 CSS pixels.
- Errors state how to fix the problem; never use `Invalid input` alone.
- Mark both required and optional fields explicitly.
- Use `child`, `parent or guardian`, and `booking` consistently instead of mixing `student`, `customer`, `participant`, `cart` and `order` in customer-facing copy.

## Component boundaries

Recommended ownership:

```text
BookingFlow
|- BookingShell
|- BookingProgress
|- BookingSummary
|- selection/
|  |- CampSelection
|  |- BirthdaySelection
|  `- IgniteSelection
|- ChildrenStep
|- ContactStep
|- ReviewStep
`- booking schema/API client
```

The selection components produce a `BookingSelection`. They do not write directly to a cart, create Stripe sessions or own contact/child forms. Shared steps do not branch on product kind except for intentional copy and pricing behaviour supplied by the selection summary.

## Safe rollout strategy

This redesign touches production payment and fulfilment paths. Release it incrementally rather than replacing all flows at once.

1. Use expand-and-contract database migrations: add nullable fields/tables first, deploy compatible readers and writers, backfill only when values are trustworthy, then enforce application-level requirements. Do not make new columns non-null against historical rows in the first migration.
2. Keep the existing checkout endpoint working while the canonical endpoint is introduced. Both paths must use the same server-owned pricing, capacity and birthday-slot services.
3. Gate routing by product (`camp`, then `birthday`, then `ignite`) so one product can be rolled back without reverting schema changes or affecting the others.
4. Deploy the new camp flow to production before deleting the old camp components. Compare fulfilment records and funnel data, not only UI completion.
5. Remove legacy schemas, cart code and endpoints only after all products use the canonical flow and production orders have been verified.
6. Database changes must remain backward compatible across at least one deployment because old and new pods can overlap during a Kubernetes rollout.

## Migration plan

### Phase 1 — Foundation and data integrity

1. Add the canonical schemas and server validation without changing existing routes.
2. Add nullable durable phone, emergency, exact DOB and school persistence using expand-and-contract migrations.
3. Stop storing sensitive participant data in persisted browser cart state.
4. Build the shared shell, summary, children, contact and review steps.
5. Add generic booking funnel events.
6. Add per-product release gates and unit tests for schema rules, age derivation, emergency defaults and price ownership.

### Phase 2 — Camps first

1. Adapt existing location/date/type selection into `CampSelection`.
2. Route camp CTAs into the shared flow.
3. Preserve multi-date pricing and capacity enforcement.
4. Verify mobile, Stripe cancel/retry, fulfilment emails and admin calendar data.
5. Compare funnel performance to the existing baseline.

### Phase 3 — Birthdays

1. Adapt venue/date/time selection into `BirthdaySelection`.
2. Preserve global one-party-per-start-time enforcement.
3. Confirm package pricing remains independent of birthday child count.
4. Introduce birthday slot holds if implemented in this phase.
5. Verify Sydney wall-clock dates in email, calendar and admin views.

### Phase 4 — Ignite

1. Adapt session selection into `IgniteSelection`.
2. Delete the separate Ignite child form and emergency-to-parent mapping.
3. Preserve server-owned Stripe recurring prices and one subscription line per child.
4. Verify recurring copy, first session date, webhook fulfilment and admin subscription data.

### Phase 5 — Returning families

1. Add family, family-contact and child-profile tables plus verification challenges.
2. Add email code delivery, rate limiting and verified family session.
3. Add saved child selection and contact prefill.
4. Require explicit consent before saving health/support details.
5. Support multiple verified family contacts without automatic identity matching.
6. Add profile update and data deletion paths before broadly promoting the feature.

### Phase 6 — Holds and cleanup

1. Add expiring camp and birthday holds.
2. Remove superseded cart and wizard components after all flows are proven.
3. Keep the cart only if real multi-product purchasing is demonstrated; do not expose it as a mandatory single-booking detour.

## Required test coverage

### Unit

- Canonical schema accepts each valid selection and rejects cross-product fields.
- DOB and activity-date age calculation, including leap years and Sydney timezone boundaries.
- School is optional and an empty value does not block booking.
- Conditional health details are required only after Yes.
- Emergency defaults to booking contact; order-level and per-child alternatives validate correctly.
- Server pricing ignores client-supplied price data.

### Integration

- Guest camp, birthday and Ignite checkout.
- Verified family retrieval and saved child selection.
- Two verified contacts can access one family without sharing credentials.
- Multiple children without repeated parent details.
- Stripe cancellation and retry without duplicate paid orders.
- Sold-out camp and newly occupied birthday slot recovery.
- Ignite cannot mix with one-time products in one Stripe session.
- Sensitive data is absent from metadata, URLs, logs and analytics payloads.

### End-to-end

- Mobile and desktop happy paths for all products.
- Apple Pay/Google Pay/Link visibility where the test environment supports them.
- Confirmation email, calendar link, admin schedule and database snapshots agree on local date/time.
- Keyboard-only completion and screen-reader error navigation.

## Research basis

- Stripe recommends asking only for fulfilment-critical fields, logical grouping, defaults, visible and accurate order summaries, guest checkout, mobile-first checkout and one-click payment methods: https://stripe.com/resources/more/checkout-screen-best-practices
- Stripe recommends clear progress, early price visibility, autofill, guest checkout and mobile/one-click experiences: https://stripe.com/resources/more/ecommerce-checkout-best-practices
- Baymard's checkout research recommends making guest checkout prominent, explicitly labelling required and optional fields, and hiding optional inputs until relevant: https://baymard.com/blog/current-state-of-checkout-ux and https://baymard.com/blog/make-guest-checkout-prominent

## Explicit non-goals

- No mandatory customer account.
- No password system.
- No custom card-entry form replacing Stripe Checkout.
- No single giant wizard containing product-specific conditionals everywhere.
- No child PII in analytics or Stripe metadata.
- No automatic merging of historical children based only on names.
- No countdown or claim that inventory is held until a real server-side hold exists.
