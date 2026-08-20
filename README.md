# Form Handlers

Two drop-in form handlers:

- **`script.js`** — validates (email + phone) and forwards submissions to Klaviyo and/or your own endpoint.
- **`aisle.js`** — validates phone, then posts to Aisle and Klaviyo in parallel.

Both handlers:
- Look up the submit button via `form.querySelector("[type='submit']")`.
- Validate on submit only (no live validation, no submit-button toggling).
- Swap the submit button into a spinner state while in-flight; restore it on error.
- Append all URL query params to the form as hidden inputs.
- Push `{ event: "form-submitted" }` and `{ event: "form_submitted" }` to `dataLayer` after a successful submit.

---

## `script.js` — Klaviyo handler

### Loading

```html
<script defer src="https://cdn.jsdelivr.net/gh/vanilla-masker/vanilla-masker/lib/vanilla-masker.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/Bucked-Up/handle-webflow-form@1/script.min.js"></script>
<script>
  document.addEventListener("DOMContentLoaded",()=>{
    handleForm({
      formId: "",
      hasPhoneNumber: false,
      phoneNumberIsRequired: false,
      advancedEmailCheck: false,    // strict regex + TLD/typo blocklist
      submitFunction: () => {},     // runs after successful submit
      klaviyo: {
        klaviyoA: "",
        klaviyoG: "",
      },
      customEndpoint: {              // optional, fires in parallel with Klaviyo
        fn: async (formData, event) => {},
        onError: (error) => {},
      },
    });
  })
</script>
```

If `hasPhoneNumber` is `true`, [VanillaMasker](https://github.com/vanilla-masker/vanilla-masker) must be loaded on the page — the script calls `VMasker(phoneField).maskPattern("999-999-9999")` directly.

### Options

| Option | Description |
| --- | --- |
| `formId` | ID of the `<form>` element. |
| `hasPhoneNumber` | If `true`, the form has a `[name='phone_number']` field — it's masked with VanillaMasker and validated against `/^\d{3}-\d{3}-\d{4}$/`. |
| `phoneNumberIsRequired` | If `true`, empty phone is invalid; otherwise empty is allowed. |
| `advancedEmailCheck` | Enables strict email regex plus a built-in TLD/typo blocklist (e.g. `.con`, `gmial.com`). |
| `submitFunction` | Called after a successful submit. |
| `customEndpoint` | Optional `{ fn, onError }` pair for posting to your own backend. See below. |

### Klaviyo options

```js
klaviyo: {
  klaviyoA: "",                 // list "a" param
  klaviyoG: "",                 // list "g" param
  customTextFields: [],         // names of extra text fields to forward
  customCheckFields: [],        // ids of extra checkbox fields (sent as true/false)
  forceChecksTrue: [],          // names that should be sent as true regardless of the form
}
```

- `accepts-marketing` and any `forceChecksTrue` entries are always sent as `true`.
- If `hasPhoneNumber` is on and there is no `[name='sms-consent']` field, `sms-consent` is auto-added to `forceChecksTrue`.
- If the form has a `full_name` field, it's split into `first_name` (everything before the first space) and `last_name` (the remainder). A single-word name sends `first_name` only. `full_name` itself is dropped from the payload. This applies to the Klaviyo payload only — `customEndpoint` receives the raw `full_name`.

### `customEndpoint`

Sends the submission to your own backend. Fires **in parallel** with Klaviyo when both are
configured, and on its own when `klaviyo` is omitted.

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
| `fn` | `async (formData, event)`. Required to enable the integration — it's skipped unless this is a function. `formData` is a fresh `FormData` built from the form (phone normalized, URL params included) and is **not** the one sent to Klaviyo, so Klaviyo's `$fields`/checkbox rewrites don't leak into your payload. `event` is the raw submit event. |
| `onError` | Optional `(error)`. Called if `fn` rejects. |

**A rejection fails the whole submit**, exactly like a Klaviyo failure: `onError` runs, then the
error propagates — the `dataLayer` events are not pushed, `submitFunction` is not called, and the
submit button is restored to its original label and re-enabled. Throwing from inside `onError` is
contained (logged, never masks the original error).

### Validation behavior

- Checked once on submit. Invalid → `alert("Field invalid. Please check for typos.")` and the request is not sent.

---

## `aisle.js` — Aisle + Klaviyo handler

Posts to Aisle's `manual-input` webhook and Klaviyo in parallel.

### Loading

```html
<script defer src="https://cdn.jsdelivr.net/gh/vanilla-masker/vanilla-masker/lib/vanilla-masker.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/Bucked-Up/handle-webflow-form@1/aisle.min.js"></script>
<script>
  document.addEventListener("DOMContentLoaded",()=>{
    handleForm({
      formId: "",
      campaignPhoneNumber: "",
      apiKey: "",
      klaviyoA: "",
      klaviyoG: "",
      submitFunction: () => {},
    });
  })
</script>
```

### Form requirements

- A `#phone_number` input (masked `999-999-9999`).
- An `#email` input.
- A submit button inside the form (found via `[type='submit']`).

### Options

| Option | Description |
| --- | --- |
| `formId` | ID of the `<form>` element. |
| `campaignPhoneNumber` | Sent to Aisle as `campaignPhoneNumber`. |
| `apiKey` | Aisle API key (sent as the `x-api-key` header). |
| `klaviyoA` / `klaviyoG` | Klaviyo list params. |
| `submitFunction` | Called after both Aisle and Klaviyo resolve successfully. |

### Validation behavior

- Phone is required: the digit-stripped value must be at least 10 digits long.
- Invalid → `alert("Phone field invalid. Please check if every number is present.")` and the request is not sent.

### Klaviyo payload

`Accepts-Marketing` and `sms_consent` are always sent as `true`. All URL params are forwarded as `$fields`.

### Error handling

If either request fails, the submit button's HTML and disabled state are restored, the error is logged to `console.error`.

### Full example

```html
<!-- Dependencies (load before aisle.js) -->
<script defer src="https://cdn.jsdelivr.net/gh/vanilla-masker/vanilla-masker/lib/vanilla-masker.min.js"></script>

<form id="signup-form">
  <input type="email" id="email" name="email" placeholder="Email" required />
  <input type="tel" id="phone_number" name="phone_number" placeholder="555-123-4567" required />
  <button type="submit">Get VIP access</button>
</form>

<script src="https://cdn.jsdelivr.net/gh/Bucked-Up/handle-webflow-form@1/aisle.min.js"></script>
<script>
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
</script>
```
