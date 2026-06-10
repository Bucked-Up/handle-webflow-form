const handleForm = ({ campaignPhoneNumber, apiKey, formId, submitFunction, klaviyoA, klaviyoG }) => {
  const form = document.getElementById(formId);
  const submitBtn = form.querySelector("[type='submit']");
  const phoneField = document.getElementById("phone_number");
  const emailField = document.getElementById("email");
  VMasker(phoneField).maskPattern("999-999-9999");

  const phoneNumberIsNotValid = () => phoneField.value.trim().replace(/\D/g, '').length < 10;

  const postAisle = async (body) => {
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
  };

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
    e.preventDefault();
    if (phoneNumberIsNotValid()) {
      alert("Phone field invalid. Please check if every number is present.");
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

    const body = {
      customerPhoneNumber: phoneField.value.replace(/\D/g, ''),
      campaignPhoneNumber: campaignPhoneNumber,
      email: emailField.value,
    };
    const formData = new FormData(e.target);
    formData.set("phone_number", phoneField.value.replace(/\D/g, ''));
    formData.append("$fields", ["Accepts-Marketing", "sms_consent", ...Object.keys(utms)]);
    formData.append("Accepts-Marketing", true);
    formData.append("sms_consent", true);

    try {
      await Promise.all([postAisle(body), postKlaviyo(formData)]);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "form-submitted" });
      window.dataLayer.push({ event: "form_submitted" });
      submitFunction();
    } catch (error) {
      submitBtn.innerHTML = originalBtnHTML;
      submitBtn.removeAttribute("disabled");
      console.error("Error:", error);
    }
  });
};
