(function () {
  "use strict";
  var STORAGE_KEY = "leotech_lang";
  var DEFAULT_LANG = "pt";
  var state = { lang: localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG };

  function t(key) {
    var dict = LEOTECH_I18N[state.lang] || LEOTECH_I18N[DEFAULT_LANG];
    return dict[key] || LEOTECH_I18N[DEFAULT_LANG][key] || key;
  }

  function applyTranslations() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    var label = document.getElementById("langLabel");
    if (label) label.textContent = state.lang === "pt" ? "Português" : "English";
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === state.lang);
    });
    document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang: state.lang } }));
  }

  function setLang(lang) {
    if (!LEOTECH_I18N[lang]) return;
    state.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
  }

  function initLangSwitch() {
    var wrap = document.getElementById("langSwitch");
    if (!wrap) return;
    var btn = wrap.querySelector(".lang-btn");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function () {
      wrap.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
    wrap.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.addEventListener("click", function () {
        setLang(b.getAttribute("data-lang-btn"));
        wrap.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initMobileMenu() {
    var toggle = document.getElementById("menuToggle");
    var nav = document.getElementById("mainNav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initActiveLink() {
    var current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav a").forEach(function (a) {
      var target = a.getAttribute("href").split("/").pop();
      if (target === current) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });
  }

  function updateCartCount() {
    var el = document.getElementById("cartCount");
    if (!el) return;
    var items = [];
    try { items = JSON.parse(localStorage.getItem("leotech_cart")) || []; } catch (e) {}
    var n = items.reduce(function (sum, i) { return sum + (Number(i.qty) || 1); }, 0);
    el.textContent = n;
    el.style.display = n ? "grid" : "none";
  }

  function initAuthHeader() {
    var wrap = document.getElementById("authWrap");
    if (!wrap) return;
    var user = window.LeotechAuth && window.LeotechAuth.getUser();
    wrap.innerHTML = "";

    var inSub = window.location.pathname.includes('/conta/') || window.location.pathname.includes('/admin/') || window.location.pathname.includes('/estafeta/');
    var prefix = inSub ? "../" : "";

    if (user) {
      var menu = document.createElement("div");
      menu.className = "user-menu";
      menu.id = "userMenu";
      var first = (user.name || "Conta").split(" ")[0];

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "user-btn";
      btn.innerHTML = '<i class="fa-solid fa-circle-user"></i> <span>' + first + '</span> <i class="fa-solid fa-chevron-down" style="font-size:.7em"></i>';

      // Lógica do Menu do Utilizador baseada no cargo
      var links = "";
      
      if (user.role === "estafeta") {
        links = '<li><a href="' + prefix + 'estafeta/index.html" style="color: var(--primary); font-weight: 800; border-bottom: 1px solid #eee; margin-bottom: 4px;"><i class="fa-solid fa-truck-fast"></i> Painel de Entregas</a></li>';
      } else {
        if (user.email === "admin@leotech.co.mz" || user.role === "admin") {
          links += '<li><a href="' + prefix + 'admin/index.html" style="color: var(--primary); font-weight: 800; border-bottom: 1px solid #eee; margin-bottom: 4px;"><i class="fa-solid fa-shield-halved"></i> Painel Admin</a></li>';
        }
        links +=
          '<li><a href="' + prefix + 'conta/perfil.html"><i class="fa-solid fa-user"></i> <span data-i18n="user.profile">Perfil</span></a></li>' +
          '<li><a href="' + prefix + 'conta/pedidos.html"><i class="fa-solid fa-box"></i> <span data-i18n="user.orders">Os meus pedidos</span></a></li>' +
          '<li><a href="' + prefix + 'conta/servicos.html"><i class="fa-solid fa-screwdriver-wrench"></i> <span data-i18n="user.services">Os meus serviços</span></a></li>';
      }

      var dd = document.createElement("ul");
      dd.className = "user-dropdown";
      
      dd.innerHTML = links + '<li><button type="button" id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i> <span data-i18n="user.logout">Sair</span></button></li>';

      menu.appendChild(btn);
      menu.appendChild(dd);
      wrap.appendChild(menu);

      dd.querySelectorAll("[data-i18n]").forEach(function (el) {
        el.textContent = t(el.getAttribute("data-i18n"));
      });

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        menu.classList.toggle("open");
      });
      document.addEventListener("click", function () { menu.classList.remove("open"); });
      document.getElementById("logoutBtn").addEventListener("click", function () {
        window.LeotechAuth.logout();
      });
    } else {
      var a = document.createElement("a");
      a.href = prefix + "login.html";
      a.className = "btn btn-outline btn-sm";
      a.setAttribute("data-i18n", "nav.login");
      a.textContent = t("nav.login");
      wrap.appendChild(a);
    }
  }

  function initYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLangSwitch();
    initMobileMenu();
    initActiveLink();
    updateCartCount();
    initAuthHeader();
    initYear();
    applyTranslations();
    document.addEventListener("languagechange", initAuthHeader);
    window.addEventListener("storage", updateCartCount);
    document.addEventListener("cart-updated", updateCartCount);
  });

  window.LeotechLang = { get: function () { return state.lang; }, set: setLang, t: t };
  window.LeotechCart = { update: updateCartCount };
})();