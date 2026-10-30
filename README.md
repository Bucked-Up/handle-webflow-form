# Form Handlers

This repository contains two form handlers for Webflow pages:

- **`script.js`**: Validates the email and the phone. Sends the form to Klaviyo, to your endpoint, or to both.
- **`aisle.js`**: Validates the phone. Sends the form to Aisle and to Klaviyo.

Each file defines a global function `handleForm(options)`.

## Common behavior

Both handlers do these steps:

1. Find the submit button with `form.querySelector("[type='submit']")`.
2. Add each URL query parameter to the form as a hidden input.
3. Format the phone field as `999-999-9999` on each input. This includes typing, paste, and browser autofill. The handler removes a leading `+1`.
4. Set `autocomplete="tel-national"` on the phone field if the field has no `autocomplete` attribute.
5. Validate the fields when the user submits the form. If a field is not valid, show an `alert` and stop.
6. Show a spinner in the submit button and disable the button during the request. In `script.js`, an `<input type="submit">` shows its `data-wait` text (or `"Please wait..."`) instead of a spinner.
7. If a request fails, restore the button and write the error to `console.error`.

The handlers do not validate during typing.

## Versions

jsDelivr serves the files from GitHub. Releases are git tags (`vMAJOR.MINOR.PATCH`). A URL with `@3` gets the newest `v3.x.x` release.

---

## `script.js`: Klaviyo handler

### Installation

```html
<script defer src="https://cdn.jsdelivr.net/gh/Bucked-Up/handle-webflow-form@3/script.min.js"></script>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    handleForm({
      formId: "",
      hasPhoneNumber: false,
      phoneNumberIsRequired: false,
      advancedEmailCheck: false,
      ignoreUrlParams: [],
      isWebflow: false,
      fireLeadEvent: true,
      phoneFromUrl: false,
      submitFunction: () => {},
      klaviyo: {
        klaviyoA: "",
        klaviyoG: "",
      },
      customEndpoint: {
        fn: async (formData, event) => {},
        onError: (error) => {},
      },
    });
  });
</script>
```

### Options

| Option | Description |
| --- | --- |
| `formId` | The ID of the `<form>` element. |
| `hasPhoneNumber` | Set to `true` if the form has a `[name='phone_number']` field. The handler then formats and validates the phone. |
| `phoneNumberIsRequired` | Set to `true` to make the phone necessary. If `false`, an empty phone is valid. |
| `advancedEmailCheck` | Set to `true` to validate the `[name='email']` field. The handler uses a strict regex and a list of typical typos (for example `.con` and `@gmial.com`). |
| `ignoreUrlParams` | The names of URL parameters that the handler must not add to the form. The default is `[]`. Use this option when a URL parameter has the same name as a form field. If you do not, the form sends that name two times. |
| `isWebflow` | Set to `true` on a Webflow Form Block. Webflow then also records the submission. Refer to [Webflow](#webflow). The default is `false`. |
| `fireLeadEvent` | Set to `false` to not push the `lead-captured` event to `dataLayer`. The default is `true`. Refer to [`dataLayer` event](#datalayer-event). |
| `phoneFromUrl` | Set to `true` to send the `phone_number` URL parameter to the Klaviyo profile. Use it on a page with no phone field, for example a thank-you survey. The default is `false`. Refer to [Profile](#profile). |
| `submitFunction` | A function that runs after a successful submit. |
| `klaviyo` | The Klaviyo settings. Klaviyo is off if `klaviyoA` is empty. Refer to [Klaviyo options](#klaviyo-options). |
| `customEndpoint` | The settings for your endpoint. Refer to [`customEndpoint`](#customendpoint). |

### Validation

The handler shows one `alert` with one message for each field that is not valid.

| Field | The field is not valid when |
| --- | --- |
| Email (only with `advancedEmailCheck`) | The format is incorrect. Or the email ends with a known typo. The message shows the typo, for example `".con"`. |
| Phone (only with `hasPhoneNumber`) | The phone is empty and `phoneNumberIsRequired` is `true`. Or the phone has fewer than 10 digits. Or the area code starts with 0 or 1. |

### Klaviyo options

```js
klaviyo: {
  klaviyoA: "",           // Company ID
  klaviyoG: "",           // Main list ID
  smsKlaviyoList: "",     // Optional SMS list ID
  customTextFields: [],   // Names of other fields to send (a checkbox group sends an array)
  customCheckFields: [],  // IDs of checkboxes to send as true or false
  forceChecksTrue: [],    // Names to send as true
  ignoreFields: [],       // Names of fields not to send
}
```

The handler sends the data to the Klaviyo client subscriptions API (`https://a.klaviyo.com/client/subscriptions`).

#### Profile

The Klaviyo profile gets these values:

| Profile value | Source |
| --- | --- |
| `email` | The `email` field. |
| `phone_number` | The phone digits with a `+1` prefix. Only when the phone is not empty. With `phoneFromUrl` and no `hasPhoneNumber`, the handler uses the `phone_number` URL parameter. It sends that phone only if it is a valid US phone, and it does not give SMS consent for it. |
| `first_name`, `last_name` | The `full_name` field. The first word is the first name. The other words are the last name. If there is no `full_name`, the handler uses the `first_name` and `last_name` fields. |
| `properties` | The `customTextFields`, the URL parameters, the `customCheckFields`, and the `forceChecksTrue` names. |

The handler does not send `full_name` to Klaviyo. The URL parameters `email`, `phone_number`, `full_name`, `first_name`, and `last_name` do not go into `properties`.

A checkbox group is two or more checkboxes with the same `name`. When `customTextFields` contains the name of a checkbox group, the handler sends an array of the checked values, for example `["Creatine", "Protein"]`. If no checkbox is checked, the array is empty.

#### Consent and lists

- The main list (`klaviyoG`) always gets email consent.
- SMS consent is true when the phone is not empty and one of these conditions is true:
  - The page has no `[name='sms-consent']` field.
  - The `sms-consent` field is checked.
  - `forceChecksTrue` contains `"sms-consent"`.
- If there is SMS consent and no `smsKlaviyoList`, the main list also gets SMS consent.
- If there is SMS consent and an `smsKlaviyoList`, the handler also sends the profile to the SMS list. The SMS list gets SMS consent only. Thus, the SMS list does not start an email double opt-in.
- The two list requests run in parallel. If one request fails, the submit fails.

#### `ignoreFields`

`ignoreFields` removes field names from the Klaviyo `properties`. It also removes `phone_number`, `first_name`, and `last_name` from the profile when you add these names. This option has an effect on Klaviyo only. `customEndpoint` still gets all fields.

### `customEndpoint`

Use `customEndpoint` to send the form to your backend. It runs in parallel with Klaviyo. If you do not set `klaviyo`, it runs alone.

```js
customEndpoint: {
  fn: async (formData, event) => {
    const res = await fetch("/api/lead", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Lead endpoint failed: " + res.statusText);
  },
  onError: (error) => {
    console.error(error);
  },
}
```

| Key | Description |
| --- | --- |
| `fn` | `async (formData, event)`. The handler calls `fn` only if it is a function. `formData` is a new `FormData` from the form. It contains the formatted phone, the URL parameters, and the raw `full_name`. Klaviyo changes are not in it. `event` is the submit event. |
| `onError` | Optional `(error)`. The handler calls `onError` if `fn` fails. |

If `fn` fails, the full submit fails:

1. `onError` runs. If `onError` throws an error, the handler writes it to `console.error`. The original error stays.
2. The handler does not push the `dataLayer` event.
3. `submitFunction` does not run.
4. The handler restores the submit button.

### `dataLayer` event

After a successful submit, the handler pushes this event to `window.dataLayer`. If `fireLeadEvent` is `false`, the handler does not push the event.

```js
{
  event: "lead-captured",
  userid: "<rl_anonymous_id value>",
  traits: {
    email: "name@example.com",
    first_name: "Jane",
    last_name: "Doe",
    phone: "+15551234567",
  },
}
```

The handler adds a trait only when it has a value. If there are no traits, the event has no `traits` key.

The handler sets `userid` to the value of the `rl_anonymous_id` cookie. If there is no cookie, the event has no `userid` key.

### Webflow

Set `isWebflow: true` on a form that uses the native Webflow Form Block. Webflow then records the submission in parallel with Klaviyo and `customEndpoint`.

- The handler does not stop the Webflow submit. Webflow ignores `preventDefault()`. The handler waits for the Webflow response (`code: 200`).
- The `dataLayer` event and `submitFunction` run only after Webflow, Klaviyo, and `customEndpoint` succeed. Thus, a redirect cannot stop the Webflow request.
- If Webflow fails, the handler restores the button and `submitFunction` does not run. If Webflow does not answer in 20 seconds, the handler also shows the `.w-form-fail` block.
- If Webflow does not submit (its own validation alert, or a captcha that is not solved), the submit fails. Klaviyo and `customEndpoint` start at the same time, so they can still get the lead.
- If the email or the phone is not valid, the handler also stops the Webflow submit.
- The Webflow success block (`.w-form-done`) does not show. The form stays visible.
- Keep the **Redirect URL** of the form empty in Webflow. Do the redirect in `submitFunction`. The handler ignores `data-redirect`.
- The handler does not disable the submit button before submit. Thus, browser autofill continues to work. During the submit, a `<button>` shows the spinner. An `<input type="submit">` shows its **Waiting text** (`data-wait`), or `"Please wait..."`.

If the page has no jQuery, or Webflow does not handle the form, the handler writes a warning to `console.warn`. It then continues and does not wait for Webflow.

---

## `aisle.js`: Aisle and Klaviyo handler

### Installation

```html
<form id="signup-form">
  <input type="email" id="email" name="email" placeholder="Email" required />
  <input type="tel" id="phone_number" name="phone_number" placeholder="555-123-4567" required />
  <button type="submit">Get VIP access</button>
</form>

<script defer src="https://cdn.jsdelivr.net/gh/Bucked-Up/handle-webflow-form@1/aisle.min.js"></script>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    handleForm({
      formId: "signup-form",
      campaignPhoneNumber: "5550001111",
      apiKey: "aisle_xxxxxxxxxxxxxxxx",
      klaviyoA: "XxXxXx",
      klaviyoG: "YyYyYy",
      submitFunction: () => {
        window.location.href = "/thank-you";
      },
    });
  });
</script>
```

### Form requirements

- An input with the ID `phone_number`.
- An input with the ID `email`.
- A submit button in the form.

### Options

| Option | Description |
| --- | --- |
| `formId` | The ID of the `<form>` element. |
| `campaignPhoneNumber` | The value for `campaignPhoneNumber` in the Aisle request. |
| `apiKey` | The Aisle API key. The handler sends it in the `x-api-key` header. |
| `klaviyoA`, `klaviyoG` | The Klaviyo list parameters. |
| `submitFunction` | A function that runs after a successful submit. |

### Validation

The phone is necessary. The phone must have 10 digits or more. If the phone is not valid, an `alert` shows the problem and the handler stops.

### Requests

The handler sends two requests in parallel:

| Request | Data |
| --- | --- |
| Aisle (`manual-input` webhook) | `customerPhoneNumber` (digits only), `campaignPhoneNumber`, and `email`. |
| Klaviyo | The form fields. `phone_number` contains digits only. `Accepts-Marketing` and `sms_consent` are always `true`. The URL parameters go in `$fields`. |

### Errors

- If the Aisle request fails, the submit fails. The handler restores the button.
- If the Klaviyo request fails, the handler writes a warning to `console.warn`. The submit does not fail.

### `dataLayer` events

After a successful submit, the handler pushes `{ event: "form-submitted" }` and `{ event: "form_submitted" }` to `window.dataLayer`.
