/**
 * popup.js — простой попап без зависимостей, с лёгкой анимацией появления и исчезания.
 * Вырос из попапа проекта Rocket и попапа статей курса «Вайбдизайнер».
 *
 *   const p = Popup.open({ content: "<h1>Привет</h1>", label: "Привет", onClose() {} });
 *   p.close();
 *
 * Закрывается крестиком, клавишей Esc, кликом по фону и любым элементом с [data-popup-close].
 * Пока попап открыт, остальная страница недоступна (inert) и не прокручивается.
 * Попапы можно открывать друг поверх друга: Esc закрывает верхний.
 */
(function (global) {
  const stack = [];

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !stack.length) return;
    e.preventDefault();
    stack[stack.length - 1].close();
  });

  function open(opts = {}) {
    const back = document.activeElement;
    const root = document.createElement("div");
    root.className = "popup" + (opts.wide ? " popup--wide" : "");
    root.innerHTML =
      '<div class="popup__shade" data-popup-close></div>' +
      '<div class="popup__wrap"><div class="popup__panel" role="dialog" aria-modal="true" tabindex="-1">' +
      '<button class="popup__x" type="button" data-popup-close aria-label="Закрыть">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
      "</button>" +
      '<div class="popup__body"></div></div></div>';
    const panel = root.querySelector(".popup__panel");
    const body = root.querySelector(".popup__body");
    if (opts.label) panel.setAttribute("aria-label", opts.label);
    if (typeof opts.content === "string") body.innerHTML = opts.content;
    else if (opts.content instanceof Node) body.append(opts.content);

    // Остальная страница недоступна, как под модальным окном
    const made = [...document.body.children].filter((el) => !el.inert);
    made.forEach((el) => (el.inert = true));
    document.body.append(root);
    if (!stack.length) document.documentElement.classList.add("popup-lock");

    let closed = false;
    const api = {
      el: root,
      body,
      close() {
        if (closed) return;
        closed = true;
        // Сначала короткая анимация исчезания (120 мс), потом окно убирается со страницы
        const fast = matchMedia("(prefers-reduced-motion: reduce)").matches;
        root.classList.add("popup--out");
        root.style.pointerEvents = "none";
        setTimeout(() => root.remove(), fast ? 0 : 120);
        made.forEach((el) => (el.inert = false));
        stack.splice(stack.indexOf(api), 1);
        if (!stack.length) document.documentElement.classList.remove("popup-lock");
        if (back && back.focus) back.focus({ preventScroll: true });
        opts.onClose && opts.onClose();
      },
    };
    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-popup-close]") || e.target.classList.contains("popup__wrap")) api.close();
    });
    stack.push(api);
    panel.focus({ preventScroll: true });
    return api;
  }

  global.Popup = { open, closeAll: () => [...stack].reverse().forEach((p) => p.close()) };
})(window);
