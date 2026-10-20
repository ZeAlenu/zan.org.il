function panelOf(button: HTMLButtonElement): HTMLElement | null {
  const id = button.getAttribute("aria-controls");
  return id ? document.getElementById(id) : null;
}

function setOpen(button: HTMLButtonElement, open: boolean) {
  const panel = panelOf(button);
  button.setAttribute("aria-expanded", open ? "true" : "false");
  if (panel) panel.hidden = !open;
}

function isOpen(button: HTMLButtonElement): boolean {
  return button.getAttribute("aria-expanded") === "true";
}

function setupDesktop(nav: HTMLElement) {
  const buttons = [...nav.querySelectorAll<HTMLButtonElement>("button[aria-controls]")];
  const tops = [...nav.querySelectorAll<HTMLElement>(":scope > ul > li > .nav-top")];

  function closeOthers(except?: HTMLButtonElement) {
    for (const button of buttons) {
      if (button !== except) setOpen(button, false);
    }
  }

  function closeAll() {
    closeOthers();
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const open = isOpen(button);
      closeOthers(button);
      setOpen(button, !open);
    });
  }

  nav.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !nav.contains(target)) return;
    const topIndex = tops.indexOf(target);
    const panel = target.closest<HTMLElement>(".panel");

    if (event.key === "Escape") {
      const openButton = buttons.find(isOpen);
      if (!openButton) return;
      event.preventDefault();
      setOpen(openButton, false);
      openButton.focus();
      return;
    }

    if (topIndex >= 0) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End") {
        event.preventDefault();
        closeAll();
      }
      if (event.key === "ArrowLeft") tops[Math.min(tops.length - 1, topIndex + 1)]?.focus();
      if (event.key === "ArrowRight") tops[Math.max(0, topIndex - 1)]?.focus();
      if (event.key === "Home") tops[0]?.focus();
      if (event.key === "End") tops[tops.length - 1]?.focus();
      if (event.key === "ArrowDown" && target instanceof HTMLButtonElement && target.hasAttribute("aria-controls")) {
        event.preventDefault();
        if (!isOpen(target)) {
          closeOthers(target);
          setOpen(target, true);
          return;
        }
        panelOf(target)?.querySelector("a")?.focus();
      }
      return;
    }

    if (!panel || !(target instanceof HTMLAnchorElement)) return;
    const links = [...panel.querySelectorAll("a")];
    const index = links.indexOf(target);
    if (index < 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      links[Math.min(links.length - 1, index + 1)]?.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      links[Math.max(0, index - 1)]?.focus();
    }
  });

  nav.addEventListener("focusout", (event) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !nav.contains(next)) closeAll();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof Node) || !nav.contains(event.target)) closeAll();
  });
}

function focusable(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].filter((element) => {
    if (element.closest("[hidden]")) return false;
    return element.getClientRects().length > 0;
  });
}

function setupMobile(dialog: HTMLElement) {
  const button = document.querySelector<HTMLButtonElement>("[data-menu-button]");
  const closeButton = dialog.querySelector<HTMLButtonElement>("[data-menu-close]");
  if (!button || !closeButton) return;
  if (dialog.parentElement !== document.body) document.body.appendChild(dialog);
  const background = [...document.querySelectorAll<HTMLElement>("[data-inert-with-menu]")];

  function open() {
    dialog.hidden = false;
    button.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("nav-lock");
    for (const element of background) element.inert = true;
    closeButton.focus();
  }

  function close() {
    dialog.hidden = true;
    button.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("nav-lock");
    for (const element of background) element.inert = false;
    button.focus();
  }

  button.addEventListener("click", () => {
    if (button.getAttribute("aria-expanded") === "true") close();
    else open();
  });
  closeButton.addEventListener("click", close);

  for (const group of dialog.querySelectorAll<HTMLButtonElement>("[data-group-button]")) {
    group.addEventListener("click", () => {
      setOpen(group, !isOpen(group));
    });
  }

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusable(dialog);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function setupNav() {
  const nav = document.querySelector<HTMLElement>("[data-site-nav]");
  if (nav) setupDesktop(nav);
  const dialog = document.getElementById("mnav");
  if (dialog) setupMobile(dialog);
}
