# Webflow Form Handler

A drop-in script for Webflow forms that handles validation (email + phone) and forwards submissions to Klaviyo.

## Setup

Place the snippet in the page's footer and call `handleForm(...)`.

### Phone number field

The phone input must have `name="phone_number"`. When `hasPhoneNumber` is `true`, the script auto-loads [VanillaMasker](https://github.com/vanilla-masker/vanilla-masker) and applies the mask `999-999-9999`. Validation uses the regex `/^\d{3}-\d{3}-\d{4}$/`.

### Loading the handler

```html
<script src="https://cdn.jsdelivr.net/gh/Bucked-Up/handle-webflow-form@1/script.min.js"></script>
<script>
  handleForm({
    formId: "",
    submitBtnId: "",
    hasPhoneNumber: false,
    phoneNumberIsRequired: false,
    advancedEmailCheck: false,    // enable strict regex + TLD/typo blocklist
    submitFunction: () => {},     // runs after success / when the Webflow done state appears
    klaviyo: {
      klaviyoA: "",
      klaviyoG: "",
    },
  });
</script>
```

## Top-level options

| Option | Description |
| --- | --- |
| `formId` | ID of the `<form>` element. |
| `submitBtnId` | ID of the submit button. The script disables/enables it based on validation. |
| `hasPhoneNumber` | If `true`, the form has a `[name='phone_number']` field — VanillaMasker is loaded and the field is validated. |
| `phoneNumberIsRequired` | If `true`, an empty phone number is invalid; otherwise empty is allowed. |
| `advancedEmailCheck` | Enables strict email regex plus a built-in TLD/typo blocklist (e.g. `.con`, `gmial.com`). |
| `submitFunction` | Called after a successful submit (and when the Webflow `.w-form-done` element becomes visible). |

## Klaviyo

```js
klaviyo: {
  klaviyoA: "",                 // list "a" param
  klaviyoG: "",                 // list "g" param
  customTextFields: [],         // names of extra text fields to forward
  customCheckFields: [],        // ids of extra checkbox fields (sent as true/false)
  forceChecksTrue: [],          // names that should be sent as true regardless of the form
}
```

Notes:
- `accepts-marketing` and any `forceChecksTrue` entries are always sent as `true`.
- If `hasPhoneNumber` is on and there is no `[name='sms-consent']` field, `sms-consent` is auto-added to `forceChecksTrue`.

## Validation

- Email and phone validators are registered only when their feature is enabled (`advancedEmailCheck`, `hasPhoneNumber`).
- The submit button starts disabled if any validator is registered and re-enables only when every registered field is valid.
- Invalid fields get a red border/outline on `focusout`; styles clear once the field becomes valid.
- Pressing `Enter` while the submit button is disabled triggers an alert prompting the user to check for typos.

## Behavior notes

- All URL query params are appended to the form as hidden inputs before submission.
- After success, `dataLayer` receives `{ event: "form-submitted" }` and `{ event: "form_submitted" }`.
