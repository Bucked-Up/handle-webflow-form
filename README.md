# Form Handlers

Two drop-in form handlers:

- **`script.js`** — validates (email + phone) and forwards submissions to Klaviyo.
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
