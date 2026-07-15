interface MobileNavigationElements {
  header: HTMLElement;
  navigation: HTMLElement;
  button: HTMLButtonElement;
}

function getElements(): MobileNavigationElements | null {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const navigation = document.querySelector<HTMLElement>("[data-nav]");
  const button = document.querySelector<HTMLButtonElement>("[data-menu]");
  if (!header || !navigation || !button) return null;
  return { header, navigation, button };
}

export function initializeMobileNavigation(): void {
  const elements = getElements();
  if (!elements) return;

  const { header, navigation, button } = elements;
  const desktopQuery = window.matchMedia("(min-width: 1181px)");
  const backdrop = document.createElement("button");
  backdrop.type = "button";
  backdrop.className = "mobile-nav-backdrop";
  backdrop.setAttribute("aria-label", "Fechar menu");
  header.insertAdjacentElement("afterend", backdrop);

  let savedScrollY = 0;
  let open = false;

  const updateViewportHeight = (): void => {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty("--mobile-viewport-height", `${viewportHeight}px`);
  };

  const closeMenu = (restoreScroll = true): void => {
    if (!open) return;
    open = false;
    navigation.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    document.documentElement.classList.remove("mobile-nav-open");
    document.body.classList.remove("menu-open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Abrir menu");
    if (restoreScroll) window.scrollTo({ top: savedScrollY, behavior: "auto" });
  };

  const openMenu = (): void => {
    if (open || desktopQuery.matches) return;
    savedScrollY = window.scrollY;
    open = true;
    updateViewportHeight();
    document.documentElement.style.setProperty("--page-scroll-y", `${savedScrollY}px`);
    document.documentElement.classList.add("mobile-nav-open");
    document.body.classList.add("menu-open");
    navigation.classList.add("is-open");
    backdrop.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Fechar menu");
    navigation.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
  };

  button.addEventListener("click", () => {
    if (open) closeMenu();
    else openMenu();
  });

  backdrop.addEventListener("click", () => closeMenu());
  navigation.addEventListener("click", (event) => {
    if ((event.target as Element).closest("a")) closeMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  desktopQuery.addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });

  window.addEventListener("orientationchange", () => closeMenu());
  window.addEventListener("pageshow", () => closeMenu(false));
  window.visualViewport?.addEventListener("resize", updateViewportHeight, { passive: true });
  updateViewportHeight();
}
