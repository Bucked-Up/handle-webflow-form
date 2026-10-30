const handleForm = ({ formId, hasPhoneNumber, phoneNumberIsRequired, advancedEmailCheck, klaviyo = { customTextFields: undefined, customCheckFields: undefined, forceChecksTrue: undefined, ignoreFields: undefined, klaviyoA: undefined, klaviyoG: undefined, smsKlaviyoList: undefined }, customEndpoint = { fn: undefined, onError: undefined }, ignoreUrlParams = [], isWebflow = false, fireLeadEvent = true, phoneFromUrl = false, submitFunction = () => {} }) => {
  // Webflow's own form POST; the last segment is the site ID. /signFile (file uploads) must not match.
  const WEBFLOW_FORM_ENDPOINT_PATTERN = /\/api\/v1\/form\/[^/]+$/;
  const WEBFLOW_SUBMIT_TIMEOUT_MS = 20000;
  // The jQuery.data key webflow.js keeps each form's state under (handler, redirect, done, fail, btn)
  const WEBFLOW_DATA_KEY = ".w-form";
  const WEBFLOW_HIDDEN_ATTR = "data-bfh-wf-hidden";

  const form = document.getElementById(formId);
  const submitBtn = form.querySelector("[type='submit']");
  const urlParams = new URLSearchParams(window.location.search);

  const emailField = form.querySelector("[name='email']");
  const phoneField = hasPhoneNumber ? form.querySelector("[name='phone_number']") : null;
  // Formats to 999-999-9999 on every input event, which also covers paste and browser autofill
  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "1") digits = digits.slice(1);
    digits = digits.slice(0, 10);
    return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join("-");
  };
  const applyPhoneFormat = () => {
    const formatted = formatPhone(phoneField.value);
    if (formatted !== phoneField.value) phoneField.value = formatted;
  };
  if (phoneField) {
    if (!phoneField.hasAttribute("autocomplete")) phoneField.setAttribute("autocomplete", "tel-national");
    phoneField.addEventListener("input", applyPhoneFormat);
    applyPhoneFormat();
  }

  // Each returns an error message, or "" when the field is valid
  const getEmailError = () => {
    if (!advancedEmailCheck || !emailField) return "";
    // prettier-ignore
    const tldTypos=[".con",".cmo",".cim",".vom",".xom",".coom",".comn",".comm",".cok",".col",".cop",".cpom",".com,",".com/",".com\\",".c0m",".cocm",".com-",".com;",".coim",".com`",".c.om",".com/",".cpm",".cim",".cim",".cok",".c9m",".netw",".nte",".nett",".net,",".net/",".net\\",".orgg",".ogr",".org,",".org/",".org\\",".ed.",".edu,",".edu/",".edu\\",".cim",".coim",".coim.",".coim,",".coim/",".coim\\",".dom",".fom",".xom",".vcom",".bom",".hom",".ncom",".moc",".mcom",".comc",".cokn",".vomm",".copm",".cma",".ckm",".colm",".como",".coom",".coom.",".coom,",".coom/",".coom\\",".co.,",".co./",".co.\\",".comm",".comm.",".comm,",".comm/",".comm\\","@gamil.com","@gmai.com","@gmaill.com","@gnail.com","@gmail.con","@gmail,com","@gmail.","@gmail,","@gmail\\","@gmail/","@gmail.co","@gmail.cmo","@gmai.com","@gmail.ccm","@gmail.cm","@gmail.om","@gmail.xom","@gmal.com","@gmial.com","@g-mail.com","@gmil.com","@ygmail.com","@hotmial.com","@hotmal.com","@hotmaill.com","@htomail.com","@hotmial.co","@hotmal.co","@hotmail.con","@hotmail,com","@hotmail.","@hotmail,","@hotmail\\","@hotmail/","@hotmail.co","@hotmail.cmo","@hotmai.com","@outlok.com","@outllok.com","@outlok.co","@outllook.com","@outllok.com","@outlook.con","@outlook,com","@outlook.","@outlook,","@outlook\\","@outlook/","@yahho.com","@yaoo.com","@yhoo.com","@yaho.com","@yahao.com","@yahoo.co","@yahho.co","@yahoo.con","@yahoo,com","@yahoo.","@yahoo,","@yahoo\\","@yahoo/","@icloud.co.","@icloud.con","@icloud,com","@iclod.com","@icoud.com","@ilcoud.com","@icloid.com","@icould.com","@icloud.cm","@icloud.om","@icloud,com","@icloud.","@icloud,","@icloud\\","@msn.con","@msn.cm","@msn,com","@msn.","@msn,","@msn\\","@msn/","@live.con","@live.cm","@live,com","@live.","@live,","@live\\","@live/","@aol.con","@aol.cm","@aol,com","@aol.","@aol,","@aol\\","@aol/","@protonnmail.com","@prontonmail.com","@protonmail.con","@protonmail.cm","@protonmail,com","@protonmail.","@protonmail,","@protonmail\\","@protonmail/","@protonmail.co","@pmail.con","@pmail.cm","@pmail,com","@pmail.","@pmail,","@pmail\\","@pmail/","@gogle.com","@gooogle.com","@goggle.com","@goole.com","@googel.com","@gogl.com","@gogole.com",".cok",".c0m",".c9m",".cpm",".c0n",".c,com",".clom",".ckom",".com/",".com\\",".com,",".com;",".com-",".com_",".com!",".com?",".com]",".com[",".com}",".com{","@gmail.clm","@hmail.com","@gmsil.com","@yqhoo.com","@gamil.com","@gmil.com"];
    const emailRegex = /^(?!.*\.\.)([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,24}$/;
    const email = emailField.value.trim();
    if (!emailRegex.test(email)) return "Please enter a valid email address, like name@example.com.";
    const typo = tldTypos.find((t) => email.toLowerCase().endsWith(t));
    if (typo) return `Your email ends in "${typo}", which looks like a typo. Please check it.`;
    return "";
  };

  const getPhoneError = () => {
    if (!hasPhoneNumber) return "";
    const digits = phoneField.value.replace(/\D/g, "");
    if (digits === "") return phoneNumberIsRequired ? "Please enter your phone number." : "";
    if (digits.length < 10) return "Please enter your full 10-digit phone number.";
    if (!/^[2-9]\d{2}-\d{3}-\d{4}$/.test(phoneField.value)) return "Please enter a valid US phone number. The area code can't start with 0 or 1.";
    return "";
  };

  const utms = Object.fromEntries([...urlParams.entries()].filter(([key]) => !ignoreUrlParams.includes(key)));
  Object.keys(utms).forEach((key) => {
    const input = document.createElement("input");
    input.type = "text";
    input.setAttribute("hidden", "hidden");
    input.name = key;
    input.value = utms[key];
    form.appendChild(input);
  });

  const buildFormData = (e) => {
    const formData = new FormData(e.target);
    if (hasPhoneNumber) {
      formData.set("phone_number", phoneField.value.trim());
    }
    return formData;
  };

  const getNames = (formData) => {
    const fullName = (formData.get("full_name") || "").trim().replace(/\s+/g, " ");
    const nameParts = fullName !== "" ? fullName.split(" ") : [];
    const firstName = nameParts[0] || (formData.get("first_name") || "").trim();
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : (formData.get("last_name") || "").trim();
    return { firstName, lastName };
  };

  const getPhoneDigits = () => (hasPhoneNumber ? phoneField.value.replace(/\D/g, "") : "");

  // A phone from the URL (for example on a thank-you page) goes to the profile only, never to SMS consent.
  // The visitor can't fix a hidden value, so a number that isn't a valid US phone is skipped, not rejected.
  const getUrlPhoneDigits = () => {
    if (!phoneFromUrl || hasPhoneNumber) return "";
    let digits = (urlParams.get("phone_number") || "").replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "1") digits = digits.slice(1);
    if (digits === "") return "";
    // Unlike formatPhone, no truncation: a longer number is a foreign one, not a typo
    if (!/^[2-9]\d{9}$/.test(digits)) {
      console.warn("handleForm: phone_number in the URL is not a valid US phone; not sending it.");
      return "";
    }
    return digits;
  };

  // URL parameters that are profile attributes; they don't also go into properties
  const PROFILE_FIELD_NAMES = ["email", "phone_number", "full_name", "first_name", "last_name"];

  // Several checkboxes with one name send all checked values as an array
  const isCheckboxGroup = (name) => form.querySelectorAll(`input[type='checkbox'][name='${CSS.escape(name)}']`).length > 1;

  const handleKlaviyo = async (e) => {
    const formData = buildFormData(e);
    klaviyo.customTextFields = klaviyo.customTextFields || [];
    klaviyo.customCheckFields = klaviyo.customCheckFields || [];
    klaviyo.forceChecksTrue = klaviyo.forceChecksTrue || [];
    klaviyo.ignoreFields = klaviyo.ignoreFields || [];
    const isIgnored = (name) => klaviyo.ignoreFields.includes(name);

    const phoneDigits = getPhoneDigits();
    const profilePhoneDigits = phoneDigits || getUrlPhoneDigits();
    const smsConsentField = document.querySelector("[name='sms-consent']");
    // No consent checkbox on the form means submitting a phone number implies SMS consent
    const hasSmsConsent = phoneDigits !== "" && (!smsConsentField || smsConsentField.checked || klaviyo.forceChecksTrue.includes("sms-consent"));

    const { firstName, lastName } = getNames(formData);

    const properties = {};
    [...klaviyo.customTextFields, ...Object.keys(utms).filter((name) => !PROFILE_FIELD_NAMES.includes(name))].forEach((name) => {
      if (isCheckboxGroup(name)) properties[name] = formData.getAll(name);
      else if (formData.has(name)) properties[name] = formData.get(name);
    });
    klaviyo.customCheckFields.forEach((checkFieldId) => {
      properties[checkFieldId] = document.getElementById(checkFieldId).checked;
    });
    klaviyo.forceChecksTrue
      .filter((name) => name !== "sms-consent")
      .forEach((name) => {
        properties[name] = true;
      });
    klaviyo.ignoreFields.forEach((name) => delete properties[name]);

    const emailConsent = { marketing: { consent: "SUBSCRIBED" } };
    const smsConsent = { marketing: { consent: "SUBSCRIBED" } };
    const sendToSmsList = klaviyo.smsKlaviyoList && hasSmsConsent;

    const profileAttributes = {
      email: formData.get("email"),
      properties,
    };
    if (profilePhoneDigits !== "" && !isIgnored("phone_number")) profileAttributes.phone_number = `+1${profilePhoneDigits}`;
    if (firstName && !isIgnored("first_name")) profileAttributes.first_name = firstName;
    if (lastName && !isIgnored("last_name")) profileAttributes.last_name = lastName;

    // Only channels listed in `subscriptions` get subscribed to the list
    const subscribe = async (listId, subscriptions) => {
      const response = await fetch(`https://a.klaviyo.com/client/subscriptions?company_id=${klaviyo.klaviyoA}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.api+json",
          revision: "2026-10-15",
        },
        body: JSON.stringify({
          data: {
            type: "subscription",
            attributes: {
              profile: { data: { type: "profile", attributes: { ...profileAttributes, subscriptions } } },
            },
            relationships: {
              list: { data: { type: "list", id: listId } },
            },
          },
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        return Promise.reject(`Error sending to klaviyo (list ${listId}): ${response.status} ${errorBody}`);
      }
    };

    // Main list gets email consent (plus SMS when there's no dedicated SMS list).
    // SMS list gets SMS consent only, so it never triggers an email double opt-in.
    const mainSubscriptions = { email: emailConsent };
    if (hasSmsConsent && !sendToSmsList) mainSubscriptions.sms = smsConsent;
    const requests = [subscribe(klaviyo.klaviyoG, mainSubscriptions)];
    if (sendToSmsList) {
      requests.push(subscribe(klaviyo.smsKlaviyoList, { sms: smsConsent }));
    }
    await Promise.all(requests);
  };

  const handleCustomEndpoint = async (e) => {
    try {
      await customEndpoint.fn(buildFormData(e), e);
    } catch (error) {
      if (typeof customEndpoint.onError === "function") {
        try {
          customEndpoint.onError(error);
        } catch (handlerError) {
          console.error(handlerError);
        }
      }
      throw error;
    }
  };

  const getCookie = (name) => {
    const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
    if (!entry) return "";
    try {
      return decodeURIComponent(entry.slice(name.length + 1));
    } catch {
      return "";
    }
  };

  const getUserId = () => {
    const value = getCookie("rl_anonymous_id");
    // RudderStack v3 stores cookies as "RS_ENC_v3_" + base64 of a JSON string.
    if (value.startsWith("RS_ENC_v3_")) {
      try {
        return String(JSON.parse(atob(value.slice("RS_ENC_v3_".length))) || "");
      } catch {
        return "";
      }
    }
    return value.replace(/^"|"$/g, "");
  };

  const pushLeadCapturedEvent = (e) => {
    const formData = buildFormData(e);
    const { firstName, lastName } = getNames(formData);
    const phoneDigits = getPhoneDigits() || getUrlPhoneDigits();
    const email = (formData.get("email") || "").trim();
    const traits = {};
    if (email) traits.email = email;
    if (firstName) traits.first_name = firstName;
    if (lastName) traits.last_name = lastName;
    if (phoneDigits) traits.phone = `+1${phoneDigits}`;
    const leadCapturedEvent = { event: "lead-captured" };
    const userId = getUserId();
    if (userId) leadCapturedEvent.userid = userId;
    if (Object.keys(traits).length) leadCapturedEvent.traits = traits;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(leadCapturedEvent);
  };

  if (isWebflow) {
    // A stylesheet !important beats the inline display jQuery's .toggle() writes, so Webflow's success
    // block never shows. .w-form-fail is left alone: it is Webflow's error UI and still useful.
    if (!window.__bfhWebflowStylesInjected) {
      window.__bfhWebflowStylesInjected = true;
      const style = document.createElement("style");
      style.textContent = `[${WEBFLOW_HIDDEN_ATTR}]{display:none!important}`;
      document.head.appendChild(style);
    }
    form.closest(".w-form")?.querySelector(":scope > .w-form-done")?.setAttribute(WEBFLOW_HIDDEN_ATTR, "");
  }

  // <input type="submit"> (Webflow's default button) has no innerHTML to put a spinner in
  const submitIsInput = submitBtn.tagName === "INPUT";
  const originalSubmitLabel = submitIsInput ? submitBtn.value : submitBtn.innerHTML;
  let isSubmitting = false;

  const setSubmitLoading = () => {
    submitBtn.setAttribute("disabled", "disabled");
    if (submitIsInput) {
      submitBtn.value = submitBtn.dataset.wait || "Please wait...";
      return;
    }
    submitBtn.innerHTML = `
        <svg style="display:block;margin:auto;" width="24" height="24" stroke="#fff"
          viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <style>
            .spinner_V8m1 { transform-origin: center; animation: spinner_zKoa 2s linear infinite }
            .spinner_V8m1 circle { stroke-linecap: round; animation: spinner_YpZS 1.5s ease-in-out infinite }
            @keyframes spinner_zKoa { 100% { transform: rotate(360deg) } }
            @keyframes spinner_YpZS {
              0%           { stroke-dasharray: 0 150;  stroke-dashoffset: 0   }
              47.5%        { stroke-dasharray: 42 150; stroke-dashoffset: -16 }
              95%, 100%    { stroke-dasharray: 42 150; stroke-dashoffset: -59 }
            }
          </style>
          <g class="spinner_V8m1">
            <circle cx="12" cy="12" r="9.5" fill="none" stroke-width="3"></circle>
          </g>
        </svg>
      `;
  };

  const resetSubmitButton = () => {
    submitBtn.removeAttribute("disabled");
    if (submitIsInput) submitBtn.value = originalSubmitLabel;
    else submitBtn.innerHTML = originalSubmitLabel;
  };

  // Webflow submits the form itself, from a delegated jQuery listener on document that ignores our
  // preventDefault. We let it, and only wait for its POST to land so submitFunction can't abort it.
  // Must be called synchronously from the submit listener: Webflow's listener runs right after ours,
  // in the same dispatch, and that is when its ajaxSend fires.
  const waitForWebflow = () => {
    const $ = window.jQuery;
    const webflowForm = $?.data(form, WEBFLOW_DATA_KEY);
    if (!webflowForm?.handler) {
      console.warn("handleForm: isWebflow is set but Webflow is not handling this form; not waiting for it.");
      return Promise.resolve();
    }
    // Webflow reads this only after its POST succeeds, so clearing it here still lands in time, and
    // stops Webflow navigating away while Klaviyo is still in flight
    webflowForm.redirect = null;

    return new Promise((resolve, reject) => {
      let sent = false;
      const isWebflowRequest = (settings) => WEBFLOW_FORM_ENDPOINT_PATTERN.test(settings?.url || "");
      const onSend = (_event, _xhr, settings) => {
        if (isWebflowRequest(settings)) sent = true;
      };
      const onComplete = (_event, xhr, settings) => {
        if (!isWebflowRequest(settings)) return;
        cleanup();
        // jQuery runs Webflow's .done() before it triggers ajaxComplete, so this lands in the same task
        // as Webflow hiding the form: it never visibly disappears
        form.style.display = "";
        // Webflow has just reset the button, but Klaviyo may still be running. If another request
        // already failed the submit, leave the button usable instead.
        if (isSubmitting) setSubmitLoading();
        else resetSubmitButton();
        // Same success test webflow.js uses
        if (xhr.responseJSON?.code === 200) resolve();
        else reject(new Error("Webflow submission failed"));
      };
      const timeout = setTimeout(() => {
        cleanup();
        webflowForm.fail?.show();
        reject(new Error("Webflow submission timed out"));
      }, WEBFLOW_SUBMIT_TIMEOUT_MS);
      const cleanup = () => {
        clearTimeout(timeout);
        $(document).off("ajaxSend", onSend).off("ajaxComplete", onComplete);
      };
      $(document).on("ajaxSend", onSend).on("ajaxComplete", onComplete);
      // By the next task the dispatch is over. No POST by then means Webflow refused the submit (its own
      // validation alert, an unsolved captcha) and nothing will ever complete.
      setTimeout(() => {
        if (sent) return;
        cleanup();
        reject(new Error("Webflow did not submit the form"));
      }, 0);
    });
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Still synchronous, so Webflow (which serializes the form after this listener) gets the formatted phone too
    if (phoneField) applyPhoneFormat();
    const errors = [getEmailError(), getPhoneError()].filter(Boolean);
    if (errors.length) {
      // Keeps Webflow's document-level listener from submitting a lead we reject
      if (isWebflow) e.stopPropagation();
      alert(errors.join("\n"));
      return;
    }
    isSubmitting = true;
    // Webflow reads an <input>'s value as the label to restore later, so changing it before Webflow's
    // listener runs would make it "restore" our loading text. Its own data-wait covers that window.
    if (!(isWebflow && submitIsInput)) setSubmitLoading();
    try {
      const tasks = [];
      if (isWebflow) tasks.push(waitForWebflow());
      if (klaviyo.klaviyoA) tasks.push(handleKlaviyo(e));
      if (typeof customEndpoint.fn === "function") tasks.push(handleCustomEndpoint(e));
      await Promise.all(tasks);
      if (fireLeadEvent) pushLeadCapturedEvent(e);
      submitFunction();
    } catch (e) {
      isSubmitting = false;
      resetSubmitButton();
      console.error(e);
    }
  });
};
