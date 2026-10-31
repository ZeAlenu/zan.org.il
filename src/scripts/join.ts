const form = document.querySelector<HTMLFormElement>("#join");
if (form) {
  const required = "שדה חובה";
  const phoneMessage = "מספר טלפון לא תקין";
  const emailMessage = "כתובת מייל לא תקינה";
  const unavailable = "משהו השתבש, נסו שוב";

  const show = (element: HTMLElement, message: string) => {
    const error = document.getElementById(`${element.id}-err`);
    element.setAttribute("aria-invalid", message ? "true" : "false");
    if (!error) return;
    error.hidden = !message;
    error.textContent = message;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (form.dataset.sending === "1") return;

    const name = form.elements.namedItem("name");
    const reach = form.elements.namedItem("reach");
    const profession = form.elements.namedItem("profession");
    const area = form.elements.namedItem("area");
    const time = form.querySelector<HTMLInputElement>("[name=time]:checked");
    const timeSet = document.getElementById("time");
    const timeError = document.getElementById("time-err");
    const alert = document.getElementById("join-alert");
    const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
    if (!(name instanceof HTMLInputElement) || !(reach instanceof HTMLInputElement)) return;
    if (!(area instanceof HTMLSelectElement) || !(profession instanceof HTMLInputElement)) return;
    if (!timeSet || !timeError || !submit) return;

    const value = reach.value.trim();
    let reachMessage = "";
    if (!value) reachMessage = required;
    else if (value.includes("@")) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) reachMessage = emailMessage;
    } else if (!/^(?:0?5\d[-\s]?\d{3}[-\s]?\d{4}|\+9725\d{8})$/.test(value.replace(/\s/g, ""))) {
      reachMessage = phoneMessage;
    }

    show(name, name.value.trim() ? "" : required);
    show(reach, reachMessage);
    timeError.hidden = Boolean(time);
    timeError.textContent = time ? "" : required;
    timeSet.setAttribute("aria-invalid", time ? "false" : "true");
    show(area, area.value ? "" : required);
    if (alert) alert.hidden = true;

    const invalid = form.querySelector<HTMLElement>("[aria-invalid=true]");
    if (invalid) {
      const target = invalid.tagName === "FIELDSET" ? invalid.querySelector("input") : invalid;
      target?.focus();
      return;
    }

    form.dataset.sending = "1";
    submit.disabled = true;
    const phone = value.includes("@") ? "" : value;
    const email = value.includes("@") ? value : "";
    const token = form.querySelector<HTMLTextAreaElement>("[name=cf-turnstile-response]")?.value ?? "";
    const company = form.querySelector<HTMLInputElement>("[name=company]")?.value ?? "";

    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.value.trim(),
          phone,
          email,
          time: time?.value,
          profession: profession.value.trim(),
          area: area.value,
          company,
          turnstileToken: token,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        fallback?: boolean;
        field?: string;
      };
      if (payload.ok) {
        document.getElementById("join-intro")?.setAttribute("hidden", "");
        document.getElementById("join-form")?.setAttribute("hidden", "");
        const done = document.getElementById("join-success");
        if (done) done.hidden = false;
        window.scrollTo(0, 0);
        return;
      }
      if (payload.fallback) {
        if (alert) {
          alert.hidden = false;
          alert.textContent = payload.message || unavailable;
        }
      } else if (payload.field === "phone") show(reach, phoneMessage);
      else if (payload.field === "email") show(reach, emailMessage);
      else if (payload.field === "name") show(name, required);
      else if (payload.field === "area") show(area, required);
      else if (payload.field === "time") {
        timeError.hidden = false;
        timeError.textContent = required;
      } else if (alert) {
        alert.hidden = false;
        alert.textContent = payload.message || unavailable;
      }
    } catch {
      if (alert) {
        alert.hidden = false;
        alert.textContent = unavailable;
      }
    }
    submit.disabled = false;
    form.dataset.sending = "";
  });
}
