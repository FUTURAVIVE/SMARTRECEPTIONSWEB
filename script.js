/* ==========================================================================
   Smart Receptions / Smart Events — script.js (vanilla)
   Ramas · idioma · cookies · Tally · GA4 · FAQ · animaciones
   ========================================================================== */
(function () {
  "use strict";

  /* ----- Config editable ----- */
  var GA_MEASUREMENT_ID = "G-XXXXXXXXXX";          // <-- sustituir por el ID real de GA4
  var TALLY_FORM_ID     = "wXXXXXX";                // <-- sustituir por el ID del formulario de Tally

  /* ----- Contexto de página ----- */
  var LANG = (document.documentElement.getAttribute("lang") || "es").slice(0, 2);
  var LS = window.localStorage;
  var BASE = { es: "/", en: "/en/", fr: "/fr/" };

  /* Etiquetas por rama y por idioma para las anclas de URL */
  var BRANCH_HASH = {
    es: { company: "empresa",  events: "eventos" },
    en: { company: "company",  events: "events" },
    fr: { company: "entreprise", events: "evenements" }
  };
  function hashToBranch(hash) {
    var h = (hash || "").replace("#", "").toLowerCase();
    var map = BRANCH_HASH[LANG] || BRANCH_HASH.es;
    if (h === map.company) return "company";
    if (h === map.events) return "events";
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /*  Google Analytics 4 (solo tras consentimiento)                          */
  /* ---------------------------------------------------------------------- */
  var GA_LOADED = false;
  function loadGA() {
    if (GA_LOADED || GA_MEASUREMENT_ID.indexOf("XXXX") !== -1) return;
    GA_LOADED = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  }
  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }

  /* ---------------------------------------------------------------------- */
  /*  Header: estado scroll                                                  */
  /* ---------------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------------- */
  /*  Menú móvil                                                             */
  /* ---------------------------------------------------------------------- */
  var burger = document.querySelector(".burger");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("no-scroll", open);
    });
    mobileMenu.querySelectorAll("a[href^='#'], a[data-branch-link]").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileMenu.classList.remove("open");
        burger.classList.remove("open");
        document.body.classList.remove("no-scroll");
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  Ramas: empresa / eventos                                               */
  /* ---------------------------------------------------------------------- */
  var body = document.body;
  function setBranch(branch, opts) {
    opts = opts || {};
    if (branch !== "company" && branch !== "events") branch = "company";
    body.setAttribute("data-active", branch);

    /* estado de switches y toggles */
    document.querySelectorAll("[data-branch-btn]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-branch-btn") === branch);
    });

    /* persistencia de sesión */
    try { window.sessionStorage.setItem("active_branch", branch); } catch (e) {}

    /* actualizar hash sin salto */
    if (opts.updateHash !== false) {
      var map = BRANCH_HASH[LANG] || BRANCH_HASH.es;
      if (history.replaceState) history.replaceState(null, "", "#" + map[branch]);
    }
    if (opts.track) track(branch === "company" ? "select_company" : "select_events");
  }

  /* selección inicial: hash > sesión > company */
  (function initBranch() {
    var fromHash = hashToBranch(location.hash);
    var stored = null;
    try { stored = window.sessionStorage.getItem("active_branch"); } catch (e) {}
    setBranch(fromHash || stored || "company", { updateHash: !!fromHash, track: false });
  })();

  /* botones que fijan rama y hacen scroll a #soluciones */
  document.querySelectorAll("[data-branch-set]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var b = el.getAttribute("data-branch-set");
      setBranch(b, { track: true });
      var target = document.getElementById("solucion");
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* switches (barra de rama, dropdown, menú) que solo cambian rama */
  document.querySelectorAll("[data-branch-btn]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setBranch(btn.getAttribute("data-branch-btn"), { track: true });
    });
  });

  window.addEventListener("hashchange", function () {
    var b = hashToBranch(location.hash);
    if (b) setBranch(b, { updateHash: false, track: false });
  });

  /* ---------------------------------------------------------------------- */
  /*  Tally: modal                                                           */
  /* ---------------------------------------------------------------------- */
  var modal = document.getElementById("tally-modal");
  var modalBody = modal ? modal.querySelector(".modal-body") : null;
  var lastFocus = null;

  function buildTallyUrl(branch, cta) {
    var params = new URLSearchParams();
    params.set("transparentBackground", "1");
    params.set("hideTitle", "1");
    params.set("language", LANG);
    params.set("branch", branch === "events" ? "smart_events" : "smart_receptions");
    params.set("cta", cta || "");
    /* UTM passthrough */
    var qs = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (k) {
      if (qs.get(k)) params.set(k, qs.get(k));
    });
    params.set("origin_url", location.href);
    return "https://tally.so/embed/" + TALLY_FORM_ID + "?" + params.toString();
  }

  function openTally(cta) {
    if (!modal) return;
    var branch = body.getAttribute("data-active") || "company";
    lastFocus = document.activeElement;

    if (TALLY_FORM_ID.indexOf("XXXX") !== -1) {
      /* Placeholder si aún no hay formulario configurado */
      modalBody.innerHTML =
        '<div class="tally-fallback">' +
        '<p>' + (LANG === "en"
          ? "The request form will load here once the Tally form ID is configured."
          : LANG === "fr"
          ? "Le formulaire de demande s\u2019affichera ici une fois l\u2019ID Tally configur\u00e9."
          : "Aqu\u00ed se cargar\u00e1 el formulario de solicitud cuando se configure el ID de Tally.") +
        '</p><p style="font-family:monospace;font-size:.8rem;color:#8a94a0">branch=' +
        (branch === "events" ? "smart_events" : "smart_receptions") + " · language=" + LANG +
        (cta ? " · cta=" + cta : "") + '</p></div>';
    } else {
      var iframe = document.createElement("iframe");
      iframe.src = buildTallyUrl(branch, cta);
      iframe.title = "Formulario de solicitud";
      iframe.loading = "lazy";
      modalBody.innerHTML = "";
      modalBody.appendChild(iframe);
    }

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("no-scroll");
    var closeBtn = modal.querySelector(".modal-close");
    if (closeBtn) closeBtn.focus();
    track("open_tally", { branch: branch === "events" ? "smart_events" : "smart_receptions", cta: cta || "" });
  }

  function closeTally() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    body.classList.remove("no-scroll");
    if (modalBody) modalBody.innerHTML = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll("[data-tally]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openTally(el.getAttribute("data-tally") || el.textContent.trim().slice(0, 40));
    });
  });
  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target === modal) closeTally(); });
    var mc = modal.querySelector(".modal-close");
    if (mc) mc.addEventListener("click", closeTally);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("show")) closeTally();
    });
  }

  /* ---------------------------------------------------------------------- */
  /*  Enlaces email / teléfono → GA                                          */
  /* ---------------------------------------------------------------------- */
  document.querySelectorAll("a[href^='mailto:']").forEach(function (a) {
    a.addEventListener("click", function () { track("click_email"); });
  });
  document.querySelectorAll("a[href^='tel:']").forEach(function (a) {
    a.addEventListener("click", function () { track("click_phone"); });
  });

  /* ---------------------------------------------------------------------- */
  /*  FAQ acordeón                                                           */
  /* ---------------------------------------------------------------------- */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item");
      var ans = item.querySelector(".faq-a");
      var isOpen = item.classList.toggle("open");
      q.setAttribute("aria-expanded", isOpen ? "true" : "false");
      ans.style.maxHeight = isOpen ? ans.scrollHeight + "px" : null;
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  Reveal on scroll                                                       */
  /* ---------------------------------------------------------------------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------------------------------------------------------------- */
  /*  Animación del flujo (hero)                                             */
  /* ---------------------------------------------------------------------- */
  var flowSteps = document.querySelectorAll(".flow-step");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (flowSteps.length && !reduceMotion) {
    var i = 0;
    function tickFlow() {
      flowSteps.forEach(function (s, idx) { s.classList.toggle("on", idx <= i); });
      i++;
      if (i > flowSteps.length + 1) i = 0;
    }
    tickFlow();
    setInterval(tickFlow, 1100);
  } else {
    flowSteps.forEach(function (s) { s.classList.add("on"); });
  }

  /* ---------------------------------------------------------------------- */
  /*  Cookies + carga condicional de GA                                      */
  /* ---------------------------------------------------------------------- */
  var cookieBanner = document.getElementById("cookie-banner");
  function cookieChoice() { try { return LS.getItem("cookie_consent"); } catch (e) { return null; } }
  function applyCookie(choice) {
    try { LS.setItem("cookie_consent", choice); } catch (e) {}
    if (choice === "accepted") loadGA();
    if (cookieBanner) cookieBanner.classList.remove("show");
  }
  (function initCookies() {
    var c = cookieChoice();
    if (c === "accepted") { loadGA(); }
    else if (!c && cookieBanner) { setTimeout(function () { cookieBanner.classList.add("show"); }, 900); }
  })();
  var acc = document.getElementById("cookie-accept");
  var rej = document.getElementById("cookie-reject");
  if (acc) acc.addEventListener("click", function () { applyCookie("accepted"); });
  if (rej) rej.addEventListener("click", function () { applyCookie("rejected"); });
  /* API para cookies.html */
  window.NovaCookies = {
    get: cookieChoice,
    set: applyCookie,
    reopen: function () { if (cookieBanner) cookieBanner.classList.add("show"); }
  };

  /* ---------------------------------------------------------------------- */
  /*  Detección y sugerencia de idioma                                       */
  /* ---------------------------------------------------------------------- */
  function preferred() { try { return LS.getItem("preferred_language"); } catch (e) { return null; } }
  function setPreferred(l) { try { LS.setItem("preferred_language", l); } catch (e) {} }

  /* al elegir idioma en el selector guardamos preferencia y conservamos rama */
  document.querySelectorAll("[data-lang-switch]").forEach(function (a) {
    a.addEventListener("click", function () {
      var l = a.getAttribute("data-lang-switch");
      setPreferred(l);
      track("change_language", { language: l });
      /* añadimos ancla de rama activa al destino */
      var branch = body.getAttribute("data-active") || "company";
      var map = BRANCH_HASH[l] || BRANCH_HASH.es;
      var href = a.getAttribute("href") || BASE[l];
      a.setAttribute("href", href.split("#")[0] + "#" + map[branch]);
    });
  });

  (function suggestLanguage() {
    var banner = document.getElementById("lang-suggest");
    if (!banner) return;
    if (preferred()) return; /* ya eligió antes */

    var nav = (navigator.language || navigator.userLanguage || "es").slice(0, 2).toLowerCase();
    var target = null;
    if (nav === "en" && LANG !== "en") target = "en";
    else if (nav === "fr" && LANG !== "fr") target = "fr";
    else if (nav !== "es" && nav !== "en" && nav !== "fr" && LANG !== "en") target = "en"; /* otros → inglés */

    if (!target) { setPreferred(LANG); return; } /* coincide: fijamos preferencia y no molestamos */

    var texts = {
      en: { msg: "This website is available in English.", yes: "View in English", no: "Continue in Spanish" },
      fr: { msg: "Ce site est disponible en fran\u00e7ais.", yes: "Voir en fran\u00e7ais", no: "Continuer en espagnol" }
    };
    var t = texts[target];
    var branch = body.getAttribute("data-active") || "company";
    var map = BRANCH_HASH[target];
    var href = BASE[target] + "#" + map[branch];

    banner.querySelector(".ls-flag").textContent = target === "en" ? "\uD83C\uDDEC\uD83C\uDDE7" : "\uD83C\uDDEB\uD83C\uDDF7";
    banner.querySelector(".ls-text").textContent = t.msg;
    var yes = banner.querySelector(".ls-yes");
    var no = banner.querySelector(".ls-no");
    yes.textContent = t.yes;
    yes.setAttribute("href", href);
    no.textContent = t.no;

    yes.addEventListener("click", function () { setPreferred(target); });
    no.addEventListener("click", function () { setPreferred(LANG); banner.classList.remove("show"); });

    setTimeout(function () { banner.classList.add("show"); }, 1400);
  })();

})();
