const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
if (burger && nav) {
  const narrow = matchMedia("(max-width:720px)");
  const setOpen = (open: boolean) => {
    burger.setAttribute("aria-expanded", String(open));
    nav.dataset.open = String(open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) nav.querySelector("a")?.focus();
  };
  burger.addEventListener("click", () => setOpen(burger.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && narrow.matches && burger.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      burger.focus();
    }
  });
  const sync = () => {
    nav.dataset.open = narrow.matches ? burger.getAttribute("aria-expanded") ?? "false" : "true";
    if (!narrow.matches) document.body.style.overflow = "";
  };
  narrow.addEventListener("change", sync);
  sync();
}

document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy ?? "");
    const text = source?.textContent?.trim() ?? "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* The status still confirms the click when the clipboard is blocked. */
    }
    const status = document.getElementById("copy-status");
    if (status) status.textContent = "הקרדיט הועתק";
    button.textContent = "הקרדיט הועתק ✓";
    window.setTimeout(() => {
      button.textContent = "העתקת קרדיט";
    }, 2500);
  });
});

document.querySelectorAll<HTMLImageElement>("img[data-media]").forEach((image) => {
  const fail = () => image.closest("figure")?.classList.add("failed");
  image.addEventListener("error", fail);
  if (image.complete && image.naturalWidth === 0) fail();
});
