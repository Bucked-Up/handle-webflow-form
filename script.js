const handleForm = ({ formId, hasPhoneNumber, phoneNumberIsRequired, advancedEmailCheck, klaviyo = { customTextFields: undefined, customCheckFields: undefined, forceChecksTrue: undefined, ignoreFields: undefined, klaviyoA: undefined, klaviyoG: undefined, smsKlaviyoList: undefined }, customEndpoint = { fn: undefined, onError: undefined }, ignoreUrlParams = [], submitFunction = () => {} }) => {
  const form = document.getElementById(formId);
  const submitBtn = form.querySelector("[type='submit']");
  const urlParams = new URLSearchParams(window.location.search);

  const emailField = form.querySelector("[name='email']");
  const phoneField = hasPhoneNumber ? form.querySelector("[name='phone_number']") : null;
  if (phoneField) {
    VMasker(phoneField).maskPattern("999-999-9999");
  }

  const isEmailValid = () => {
    if (!advancedEmailCheck || !emailField) return true;
    // prettier-ignore
    const tldTypos=[".con",".cmo",".cim",".vom",".xom",".coom",".comn",".comm",".cok",".col",".cop",".cpom",".com,",".com/",".com\\",".c0m",".cocm",".com-",".com;",".coim",".com`",".c.om",".com/",".cpm",".cim",".cim",".cok",".c9m",".netw",".nte",".nett",".net,",".net/",".net\\",".orgg",".ogr",".org,",".org/",".org\\",".ed.",".edu,",".edu/",".edu\\",".cim",".coim",".coim.",".coim,",".coim/",".coim\\",".dom",".fom",".xom",".vcom",".bom",".hom",".ncom",".moc",".mcom",".comc",".cokn",".vomm",".copm",".cma",".ckm",".colm",".como",".coom",".coom.",".coom,",".coom/",".coom\\",".co.,",".co./",".co.\\",".comm",".comm.",".comm,",".comm/",".comm\\","@gamil.com","@gmai.com","@gmaill.com","@gnail.com","@gmail.con","@gmail,com","@gmail.","@gmail,","@gmail\\","@gmail/","@gmail.co","@gmail.cmo","@gmai.com","@gmail.ccm","@gmail.cm","@gmail.om","@gmail.xom","@gmal.com","@gmial.com","@g-mail.com","@gmil.com","@ygmail.com","@hotmial.com","@hotmal.com","@hotmaill.com","@htomail.com","@hotmial.co","@hotmal.co","@hotmail.con","@hotmail,com","@hotmail.","@hotmail,","@hotmail\\","@hotmail/","@hotmail.co","@hotmail.cmo","@hotmai.com","@outlok.com","@outllok.com","@outlok.co","@outllook.com","@outllok.com","@outlook.con","@outlook,com","@outlook.","@outlook,","@outlook\\","@outlook/","@yahho.com","@yaoo.com","@yhoo.com","@yaho.com","@yahao.com","@yahoo.co","@yahho.co","@yahoo.con","@yahoo,com","@yahoo.","@yahoo,","@yahoo\\","@yahoo/","@icloud.co.","@icloud.con","@icloud,com","@iclod.com","@icoud.com","@ilcoud.com","@icloid.com","@icould.com","@icloud.cm","@icloud.om","@icloud,com","@icloud.","@icloud,","@icloud\\","@msn.con","@msn.cm","@msn,com","@msn.","@msn,","@msn\\","@msn/","@live.con","@live.cm","@live,com","@live.","@live,","@live\\","@live/","@aol.con","@aol.cm","@aol,com","@aol.","@aol,","@aol\\","@aol/","@protonnmail.com","@prontonmail.com","@protonmail.con","@protonmail.cm","@protonmail,com","@protonmail.","@protonmail,","@protonmail\\","@protonmail/","@protonmail.co","@pmail.con","@pmail.cm","@pmail,com","@pmail.","@pmail,","@pmail\\","@pmail/","@gogle.com","@gooogle.com","@goggle.com","@goole.com","@googel.com","@gogl.com","@gogole.com",".cok",".c0m",".c9m",".cpm",".c0n",".c,com",".clom",".ckom",".com/",".com\\",".com,",".com;",".com-",".com_",".com!",".com?",".com]",".com[",".com}",".com{","@gmail.clm","@hmail.com","@gmsil.com","@yqhoo.com","@gamil.com","@gmil.com"];
    const emailRegex = /^(?!.*\.\.)([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,24}$/;
    const email = emailField.value;
    return emailRegex.test(email) && !tldTypos.some((t) => email.toLowerCase().endsWith(t));
  };

  const isPhoneValid = () => {
    if (!hasPhoneNumber) return true;
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!phoneNumberIsRequired && phoneField.value.trim() === "") return true;
    return phoneRegex.test(phoneField.value);
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

  const handleKlaviyo = async (e) => {
    const formData = buildFormData(e);
    klaviyo.customTextFields = klaviyo.customTextFields || [];
    klaviyo.customCheckFields = klaviyo.customCheckFields || [];
    klaviyo.forceChecksTrue = klaviyo.forceChecksTrue || [];
    klaviyo.ignoreFields = klaviyo.ignoreFields || [];
    if (hasPhoneNumber && phoneField.value.trim() !== "" && !document.querySelector("[name='sms-consent']")) {
      klaviyo.forceChecksTrue.push("sms-consent");
    }
    const smsConsentField = document.querySelector("[name='sms-consent']");
    const hasSmsConsent = klaviyo.forceChecksTrue.includes("sms-consent") || (smsConsentField && smsConsentField.checked);
    const fullName = (formData.get("full_name") || "").trim().replace(/\s+/g, " ");
    if (fullName !== "") {
      const nameParts = fullName.split(" ");
      formData.set("first_name", nameParts[0]);
      if (nameParts.length > 1) {
        formData.set("last_name", nameParts.slice(1).join(" "));
      }
    }
    formData.delete("full_name");
    formData.append(
      "$fields",
      ["accepts-marketing", ...klaviyo.customTextFields, ...klaviyo.customCheckFields, ...klaviyo.forceChecksTrue, ...Object.keys(utms)].filter((f) => !klaviyo.ignoreFields.includes(f)),
    );
    klaviyo.customCheckFields.forEach((checkFieldId) => {
      const field = document.getElementById(checkFieldId);
      formData.set(checkFieldId, field.checked ? true : false);
    });
    ["accepts-marketing", ...klaviyo.forceChecksTrue].forEach((checkFieldId) => {
      formData.set(checkFieldId, true);
    });

    klaviyo.ignoreFields.forEach((name) => formData.delete(name));

    const subscribe = async (listId) => {
      const response = await fetch(`https://manage.kmail-lists.com/ajax/subscriptions/subscribe?a=${klaviyo.klaviyoA}&g=${listId}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        return Promise.reject(`Klaviyo Network response was not ok (list ${listId}): ` + response.statusText);
      }
      const data = await response.json();
      if (!data.success) return Promise.reject(`Error sending to klaviyo (list ${listId}): ` + data.errors);
    };

    const lists = [klaviyo.klaviyoG];
    if (klaviyo.smsKlaviyoList && hasPhoneNumber && phoneField.value.trim() !== "" && hasSmsConsent) {
      lists.push(klaviyo.smsKlaviyoList);
    }
    await Promise.all(lists.map(subscribe));
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isEmailValid() || !isPhoneValid()) {
      alert("Field invalid. Please check for typos.");
      return;
    }
    const originalBtnHTML = submitBtn.innerHTML;
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
    submitBtn.setAttribute("disabled", "disabled");
    try {
      const tasks = [];
      if (klaviyo.klaviyoA) tasks.push(handleKlaviyo(e));
      if (typeof customEndpoint.fn === "function") tasks.push(handleCustomEndpoint(e));
      await Promise.all(tasks);
      const leadCapturedEvent = { event: "lead-captured" };
      const email = form.querySelector("[type='email']");
      if (email) {
        leadCapturedEvent.traits = {
          email: email.value,
        };
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(leadCapturedEvent);
      submitFunction();
    } catch (e) {
      submitBtn.innerHTML = originalBtnHTML;
      submitBtn.removeAttribute("disabled");
      console.error(e);
    }
  });
};
