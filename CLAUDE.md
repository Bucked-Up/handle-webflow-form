# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Writing rules

Always use ASD-STE100 Simplified Technical English when you:

- Make a plan.
- Answer the user.
- Write to this file (`CLAUDE.md`).
- Write to `README.md`.

Obey these STE rules:

- Write procedural sentences of 20 words or fewer. Write descriptive sentences of 25 words or fewer.
- Write one instruction in each sentence. Use the imperative form for instructions.
- Use the active voice.
- Use one word for one meaning. Use the same word for the same thing each time.
- Use approved STE words and technical names. Do not use phrasal verbs or slang.
- Use articles ("a", "the") where possible.
- Write a maximum of six sentences in a paragraph.
- Use lists and tables for steps, options, and conditions.

Code identifiers, API names, and quoted strings stay unchanged.

## Repository overview

This repository contains two browser scripts. Each script defines a global function `handleForm(options)`. Webflow pages load the scripts from jsDelivr.

- `script.js`: Validates email and phone. Sends the form to Klaviyo, to a custom endpoint, or to both.
- `aisle.js`: Validates phone. Sends the form to Aisle and to Klaviyo.

There is no build step, no package manager, no linter, and no test suite. The scripts are plain ES2017+ JavaScript with no dependencies.

## Release and distribution

- jsDelivr serves the files from the GitHub repository `Bucked-Up/handle-webflow-form`.
- jsDelivr makes the `.min.js` files automatically. Do not add minified files to the repository.
- Releases are git tags with the format `vMAJOR.MINOR.PATCH`. A URL with `@3` gets the newest `v3.x.x` tag.
- A breaking change to the `handleForm` options or to the payload needs a new major version.
- The `aisle.js` URL in the README uses `@1`. Changes to `aisle.js` do not go to that URL until a `v1.x.x` tag includes them.

To test a change, load the raw file in a Webflow page or in a local HTML file. Then submit the form and examine the network requests and `window.dataLayer`.

## Architecture

The two scripts are independent copies. They do not share code. Some logic occurs in both files: the phone formatter, the spinner SVG, and the URL-parameter hidden inputs. If you change this logic in one file, examine the other file too.

### `script.js` submit sequence

1. The script formats the phone field (`[name='phone_number']`) on each `input` event and before validation.
2. `getEmailError` and `getPhoneError` return a message or `""`. One `alert` shows all messages, and the submit stops.
3. The script replaces the submit button content with a spinner and disables the button.
4. `handleKlaviyo` and `handleCustomEndpoint` run in parallel with `Promise.all`. Klaviyo runs only when `klaviyo.klaviyoA` is set. The custom endpoint runs only when `customEndpoint.fn` is a function.
5. On success, `pushLeadCapturedEvent` pushes `{ event: "lead-captured", traits }` to `dataLayer`. Then `submitFunction` runs.
6. On failure, the script restores the button and writes the error to `console.error`.

`buildFormData` makes a new `FormData` for each consumer. Thus, Klaviyo changes do not go into the custom endpoint data.

### Klaviyo in `script.js`

- The script uses the Klaviyo client subscriptions API (`https://a.klaviyo.com/client/subscriptions`) with a fixed `revision` header.
- `klaviyoA` is the company ID. `klaviyoG` is the main list ID.
- Consent uses the native `subscriptions` object, not custom properties.
- The main list always gets email consent. It gets SMS consent only when there is SMS consent and no `smsKlaviyoList`.
- The `smsKlaviyoList` list gets SMS consent only. This prevents an email double opt-in on the SMS list.
- SMS consent is true when the phone has digits and one of these conditions is true:
  - There is no `[name='sms-consent']` field on the page.
  - The `sms-consent` field is checked.
  - `forceChecksTrue` contains `"sms-consent"`.
- `getNames` splits `full_name` into a first name and a last name. If there is no `full_name`, it uses `first_name` and `last_name`.
- Profile `properties` contain `customTextFields`, URL parameters, `customCheckFields` (by element ID), and `forceChecksTrue`. `ignoreFields` removes keys from `properties`. It also removes `phone_number`, `first_name`, and `last_name` from the profile.

### `aisle.js`

- The script finds the fields by ID (`#phone_number`, `#email`), not by `name`.
- It uses the legacy Klaviyo endpoint `manage.kmail-lists.com` with `$fields`.
- `postKlaviyo` catches its own errors. Thus, only an Aisle failure stops the submit.
- On success, the script pushes `form-submitted` and `form_submitted` to `dataLayer`.
