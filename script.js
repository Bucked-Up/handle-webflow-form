const handleForm = ({
  formId,
  submitBtnId,
  hasPhoneNumber,
  phoneNumberIsRequired,
  advancedEmailCheck,
  klaviyo = { customTextFields: undefined, customCheckFields: undefined, forceChecksTrue: undefined, klaviyoA: undefined, klaviyoG: undefined },
  submitFunction = () => {},
}) => {
  const submitBtn = document.getElementById(submitBtnId);
  const form = document.getElementById(formId);
  const urlParams = new URLSearchParams(window.location.search);

  const disableSubmitBtn = () => {
    submitBtn.setAttribute("disabled", "disabled");
    submitBtn.style.filter = "contrast(0.5)";
    submitBtn.style.cursor = "not-allowed";
  };

  const setFieldInvalid = (field, invalid) => {
    field.style.borderColor = invalid ? "red" : "";
    field.style.outline = invalid ? "1px solid red" : "";
  };

  const validators = [];

  const emailField = form.querySelector("[name='email']");
  if (advancedEmailCheck && emailField) {
    // prettier-ignore
    const tldTypos=[".con",".cmo",".cim",".vom",".xom",".coom",".comn",".comm",".com.",".cok",".col",".cop",".cpom",".com,",".com/",".com\\",".c0m",".cocm",".com-",".com;",".coim",".com`",".c.om",".com/",".cm",".cpm",".cn",".cim",".co",".cim",".cok",".c9m",".netw",".net.",".ne",".nte",".nett",".net,",".net/",".net\\",".org",".orgg",".ogr",".org.",".org,",".org/",".org\\",".edu.",".ed.",".edu,",".edu/",".edu\\",".cm",".om",".cim",".coim",".coim.",".coim,",".coim/",".coim\\",".dom",".fom",".xom",".vcom",".bom",".hom",".ncom",".moc",".mcom",".comc",".cokn",".vomm",".copm",".cma",".ckm",".colm",".como",".coom",".coom.",".coom,",".coom/",".coom\\",".co.,",".co./",".co.\\",".comm",".comm.",".comm,",".comm/",".comm\\","@gamil.com","@gmai.com","@gmaill.com","@gnail.com","@gmail.con","@gmail,com","@gmail.","@gmail,","@gmail\\","@gmail/","@gmail.co","@gmail.cmo","@gmai.com","@gmail.ccm","@gmail.cm","@gmail.om","@gmail.xom","@gmal.com","@gmial.com","@g-mail.com","@gmil.com","@ygmail.com","@hotmial.com","@hotmal.com","@hotmaill.com","@htomail.com","@hotmial.co","@hotmal.co","@hotmail.con","@hotmail,com","@hotmail.","@hotmail,","@hotmail\\","@hotmail/","@hotmail.co","@hotmail.cmo","@hotmai.com","@outlok.com","@outllok.com","@outlok.co","@outllook.com","@outllok.com","@outlook.con","@outlook,com","@outlook.","@outlook,","@outlook\\","@outlook/","@yahho.com","@yaoo.com","@yhoo.com","@yaho.com","@yahao.com","@yahoo.co","@yahho.co","@yahoo.con","@yahoo,com","@yahoo.","@yahoo,","@yahoo\\","@yahoo/","@icloud.co.","@icloud.con","@icloud,com","@iclod.com","@icoud.com","@ilcoud.com","@icloid.com","@icould.com","@icloud.cm","@icloud.om","@icloud,com","@icloud.","@icloud,","@icloud\\","@msn.con","@msn.cm","@msn,com","@msn.","@msn,","@msn\\","@msn/","@live.con","@live.cm","@live,com","@live.","@live,","@live\\","@live/","@aol.con","@aol.cm","@aol,com","@aol.","@aol,","@aol\\","@aol/","@protonnmail.com","@prontonmail.com","@protonmail.con","@protonmail.cm","@protonmail,com","@protonmail.","@protonmail,","@protonmail\\","@protonmail/","@protonmail.co","@pmail.con","@pmail.cm","@pmail,com","@pmail.","@pmail,","@pmail\\","@pmail/","@gogle.com","@gooogle.com","@goggle.com","@goole.com","@googel.com","@gogl.com","@gogole.com",".cok",".c0m",".c9m",".cpm",".c0n",".c,com",".clom",".ckom",".com/",".com\\",".com.",".com,",".com;",".com-",".com_",".com!",".com?",".com]",".com[",".com}",".com{","@gmail.clm","@hmail.com","@gmsil.com","@yqhoo.com","@gamil.com","@gmil.com"];
    const emailRegex = /^(?!.*\.\.)([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,24}$/;
    const isValid = () => {
      const email = emailField.value;
      return emailRegex.test(email) && !tldTypos.some((t) => email.toLowerCase().endsWith(t));
    };
    validators.push({ field: emailField, isValid });
  }

  let phoneField;
  if (hasPhoneNumber) {
    phoneField = form.querySelector("[name='phone_number']");
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    const isValid = phoneNumberIsRequired
      ? () => phoneRegex.test(phoneField.value)
      : () => phoneField.value.trim() === "" || phoneRegex.test(phoneField.value);

    const vmaskerScript = document.createElement("script");
    vmaskerScript.src = "https://cdn.jsdelivr.net/gh/vanilla-masker/vanilla-masker/lib/vanilla-masker.min.js";
    vmaskerScript.async = true;
    vmaskerScript.onload = () => {
      VMasker(phoneField).maskPattern("999-999-9999");
    };
    document.head.append(vmaskerScript);

    validators.push({ field: phoneField, isValid });
  }

  const isFormValid = () => validators.every((v) => v.isValid());

  const updateSubmitBtn = () => {
    if (isFormValid()) {
      submitBtn.removeAttribute("disabled");
      submitBtn.style = "";
    } else {
      disableSubmitBtn();
    }
  };

  validators.forEach(({ field, isValid }) => {
    field.addEventListener("input", () => {
      setTimeout(() => {
        if (isValid()) setFieldInvalid(field, false);
        updateSubmitBtn();
      }, 0);
    });
    field.addEventListener("focusout", () => {
      setFieldInvalid(field, !isValid());
      updateSubmitBtn();
    });
  });

  if (validators.length) {
    disableSubmitBtn();
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && submitBtn.hasAttribute("disabled")) {
        alert("Field invalid. Please check for typos.");
      }
    });
  }

  const handleError = () => {
    const p = form.parentElement.querySelector(".w-form-done div");
    if (p) p.innerHTML = "Oops! Something went wrong while submitting the form.";
  };

  const formDone = form.parentElement.querySelector(".w-form-done");

  const initObserver = () => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.attributeName === "style") {
          const displayChanged = mutation.target.style.display !== mutation.oldValue;
          if (displayChanged) {
            submitFunction();
          }
        }
      }
    });
    observer.observe(formDone, {
      attributes: true,
      attributeOldValue: true,
    });
  };

  const utms = Object.fromEntries(urlParams.entries());
  Object.keys(utms).forEach((key) => {
    const input = document.createElement("input");
    input.type = "text";
    input.setAttribute("hidden", "hidden");
    input.name = key;
    input.value = utms[key];
    form.appendChild(input);
  });

  const handleKlaviyo = async (e) => {
    const formData = new FormData(e.target);
    if (hasPhoneNumber) {
      formData.set("phone_number", phoneField.value.trim());
    }
    klaviyo.customTextFields = klaviyo.customTextFields || [];
    klaviyo.customCheckFields = klaviyo.customCheckFields || [];
    klaviyo.forceChecksTrue = klaviyo.forceChecksTrue || [];
    if (hasPhoneNumber && phoneField.value.trim() !== "" && !document.querySelector("[name='sms-consent']")) {
      klaviyo.forceChecksTrue.push("sms-consent");
    }
    formData.append("$fields", ["accepts-marketing", ...klaviyo.customTextFields, ...klaviyo.customCheckFields, ...klaviyo.forceChecksTrue, ...Object.keys(utms)]);
    klaviyo.customCheckFields.forEach((checkFieldId) => {
      const field = document.getElementById(checkFieldId);
      formData.set(checkFieldId, field.checked ? true : false);
    });
    ["accepts-marketing", ...klaviyo.forceChecksTrue].forEach((checkFieldId) => {
      formData.set(checkFieldId, true);
    });

    const response = await fetch(`https://manage.kmail-lists.com/ajax/subscriptions/subscribe?a=${klaviyo.klaviyoA}&g=${klaviyo.klaviyoG}`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      return Promise.reject("Klaviyo Network response was not ok: " + response.statusText);
    }
    const data = await response.json();
    if (!data.success) return Promise.reject("Error sending to klaviyo: " + data.errors);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      if (klaviyo.klaviyoA) await handleKlaviyo(e);

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "form-submitted" });
      window.dataLayer.push({ event: "form_submitted" });
      if (formDone.style.display === "block") submitFunction();
      else if (klaviyo.klaviyoA)
        setTimeout(() => {
          submitFunction();
        }, 6000);
      initObserver();
    } catch (e) {
      handleError();
      console.error(e);
    }
  });
};
