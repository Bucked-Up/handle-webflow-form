const handleForm = ({ campaignPhoneNumber, apiKey, submitBtnId, formId, submitFunction, klaviyoA, klaviyoG }) => {
  const trySentry = ({ error, message }) => {
    try {
      if (error) {
        console.error(error);
        Sentry.captureException(error);
      } else {
        console.error(message);
        const sentryError = new Error();
        sentryError.name = "Error";
        sentryError.message = message;
        Sentry.captureException(sentryError);
      }
    } catch (e) {
      console.error("Error loading sentry.");
    }
  };
  
  const submitBtn = document.getElementById(submitBtnId);
  const form = document.getElementById(formId);
  const phoneField = document.getElementById("phone_number");
  const emailField = document.getElementById("email");
  VMasker(phoneField).maskPattern("999-999-9999");

  const disableSubmitBtn = () => {
    submitBtn.setAttribute("disabled", "disabled");
    submitBtn.style.filter = "contrast(0.5)";
    submitBtn.style.cursor = "not-allowed";
  };
  disableSubmitBtn();

  const phoneNumberIsNotValid = () => phoneField.value.trim().replace(/\D/g, '').length < 10;

  phoneField.addEventListener("input", () => {
    if (phoneNumberIsNotValid()) {
      submitBtn.setAttribute("disabled", "disabled");
    } else {
      submitBtn.removeAttribute("disabled");
      phoneField.style = "";
      submitBtn.style = "";
    }
  });
  phoneField.addEventListener("focusout", () => {
    if (phoneNumberIsNotValid()) {
      phoneField.style.borderColor = "red";
      phoneField.style.outline = "1px solid red";
      disableSubmitBtn();
    }
  });

  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && submitBtn.hasAttribute("disabled")) {
      alert("Phone field invalid. Please check if every number is present.");
    }
  });

  const handleError = () =>{
    const p = document.querySelector(".success-message div");
    if(p) p.innerHTML = "Oops! Something went wrong while submitting the form."
  }

  const formDone = document.querySelector(".w-form-done");

  const initObserver = () => {
    const targetElement = formDone;
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
    observer.observe(targetElement, {
      attributes: true,
      attributeOldValue: true,
    });
  };

  const postAisle = async (body) =>{
    const response = await fetch("https://console.gotoaisle.com/api/webhooks/manual-input", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok: " + response.statusText);
    }

    const data = await response.json();
    console.log("Success:", data);
  }

  const postKlaviyo = async (formData) => {
    try {
      const response = await fetch(`https://manage.kmail-lists.com/ajax/subscriptions/subscribe?a=${klaviyoA}&g=${klaviyoG}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Klaviyo Network response was not ok: " + response.statusText);
      }
      const data = await response.json();
      if (!data.success) throw new Error("Error sending to klaviyo: " + data.errors);
      console.log(data);
    } catch (e) {
      console.warn(e);
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const utms = Object.fromEntries(urlParams.entries());
  Object.keys(utms).forEach((key) => {
    const input = document.createElement("input");
    input.type = "text";
    input.setAttribute("hidden", "hidden");
    input.name = key;
    input.value = utms[key];
    form.appendChild(input);
  });

  form.addEventListener("submit", async (e) => {
    const body = {
      customerPhoneNumber: phoneField.value.replace(/\D/g, ''),
      campaignPhoneNumber: campaignPhoneNumber,
      email: emailField.value,
    };
    const formData = new FormData(e.target);

    formData.set("phone_number", phoneField.value.replace(/\D/g, ''))
    formData.append("$fields", ["Accepts-Marketing", "sms_consent", ...Object.keys(utms)]);
    formData.append("Accepts-Marketing", true);
    formData.append("sms_consent", true);

    try {
      await Promise.all([postAisle(body),postKlaviyo(formData)]);
      if(formDone.style.display === "block") submitFunction();
      else initObserver();
    } catch (error) {
      trySentry({error: error})
      handleError();
      console.error("Error:", error);
    }
  });
};