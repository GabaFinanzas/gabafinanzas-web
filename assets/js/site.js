/* Gaba Finanzas — JavaScript único para toda la web.
   ============================================================
   CONFIGURACIÓN: los únicos 3 valores que hay que tocar a mano.
   ============================================================ */
var GABA = {
  // ID de Google Analytics 4 (formato G-XXXXXXXXXX). Mientras tenga las X no se carga nada
  // y tampoco se muestra el aviso de cookies (no hay cookies que consentir).
  GA_ID: "G-XXXXXXXXXX",

  // URL del formulario de Formspree (formato https://formspree.io/f/xxxxxxxx).
  // Vacío = el formulario abre el programa de correo del visitante con la solicitud ya escrita.
  FORM_ENDPOINT: "",

  // Correo que recibe las solicitudes cuando no hay Formspree, y el que se muestra si algo falla.
  CONTACT_EMAIL: "albert.gabalda03@gmail.com"
};

(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Cabecera y menú móvil ---------- */
  var hdr = $("hdr"), hamb = $("hamb"), mob = $("mobile");
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  if (hamb && mob) {
    var setMenu = function (open) {
      mob.classList.toggle("open", open);
      hamb.setAttribute("aria-expanded", String(open));
      hamb.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    };
    hamb.addEventListener("click", function () { setMenu(!mob.classList.contains("open")); });
    mob.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* ---------- Cookies y Google Analytics (solo tras aceptar) ---------- */
  var KEY = "gf-consent";
  var gaReady = GABA.GA_ID && GABA.GA_ID.indexOf("XXXX") === -1;
  var store = {
    get: function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  };
  var gaLoaded = false;
  function loadGA() {
    if (!gaReady || gaLoaded) return;
    gaLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GABA.GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GABA.GA_ID);
  }
  function showBanner() {
    if ($("gf-ck")) return;
    var el = document.createElement("div");
    el.id = "gf-ck";
    el.className = "ck";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Aviso de cookies");
    el.innerHTML =
      '<p>Usamos cookies analíticas (Google Analytics) para entender cómo se usa la web. Solo se activan si las aceptas. ' +
      '<a href="cookies.html">Más información</a>.</p>' +
      '<div class="ck-btns"><button type="button" id="gf-rej">Rechazar</button><button type="button" id="gf-acc">Aceptar</button></div>';
    document.body.appendChild(el);
    $("gf-acc").onclick = function () { store.set("accepted"); el.remove(); loadGA(); };
    $("gf-rej").onclick = function () {
      var before = store.get();
      store.set("rejected");
      el.remove();
      // Si antes había aceptado, recargamos para que Analytics deje de ejecutarse en esta visita.
      if (before === "accepted") location.reload();
    };
  }
  var consent = store.get();
  if (gaReady) {
    if (consent === "accepted") loadGA();
    else if (consent !== "rejected") showBanner();
  }
  // Enlace «Configurar cookies» del pie: permite cambiar de opinión cuando se quiera.
  document.querySelectorAll("[data-cookie-settings]").forEach(function (b) {
    if (!gaReady) { b.hidden = true; return; }
    b.addEventListener("click", showBanner);
  });

  /* ---------- Animación de entrada ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    if (!("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Calculadora de interés compuesto (portada) ---------- */
  if ($("ci") && $("o-to")) {
    var fmt = function (n) { return Math.round(n).toLocaleString("es-ES", { maximumFractionDigits: 0 }) + " €"; };
    var num = function (id, min, max) {
      var v = parseFloat(String($(id).value).replace(",", "."));
      if (!isFinite(v)) v = 0;
      return Math.min(max, Math.max(min, v));
    };
    var calc = function () {
      var ci = num("ci", 0, 1e9), ap = num("ap", 0, 1e7), an = num("an", 0, 60), re = num("re", -50, 50) / 100;
      var n = Math.round(an * 12), r = Math.pow(1 + re, 1 / 12) - 1;
      var fv = r === 0 ? ci + ap * n : ci * Math.pow(1 + r, n) + ap * ((Math.pow(1 + r, n) - 1) / r);
      var aportado = ci + ap * n;
      $("o-ap").textContent = fmt(aportado);
      // Se muestra también el resultado negativo: una hipótesis de rentabilidad negativa implica pérdida.
      $("o-re").textContent = fmt(fv - aportado);
      $("o-to").textContent = fmt(fv);
    };
    ["ci", "ap", "an", "re"].forEach(function (id) { $(id).addEventListener("input", calc); });
    calc();
  }

  /* ---------- Formulario de contacto ---------- */
  var form = $("contact-form");
  if (form) {
    var status = $("form-status"), btn = form.querySelector("button[type=submit]");
    var say = function (msg, isErr) {
      status.textContent = msg;
      status.classList.toggle("err", !!isErr);
    };
    var mailLink = $("mail-link");
    if (mailLink) { mailLink.href = "mailto:" + GABA.CONTACT_EMAIL; mailLink.textContent = GABA.CONTACT_EMAIL; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements["_gotcha"] && form.elements["_gotcha"].value) return; // trampa anti-spam
      var d = {
        nombre: form.elements["nombre"].value.trim(),
        email: form.elements["email"].value.trim(),
        patrimonio: form.elements["patrimonio"].value,
        objetivo: form.elements["objetivo"].value.trim(),
        mensaje: form.elements["mensaje"].value.trim()
      };

      if (!GABA.FORM_ENDPOINT) {
        // Sin Formspree: se abre el correo del visitante con la solicitud ya redactada.
        var body = "Nombre: " + d.nombre + "\nEmail: " + d.email + "\nPatrimonio aproximado: " + d.patrimonio +
          "\nObjetivo principal: " + d.objetivo + "\n\n" + d.mensaje;
        location.href = "mailto:" + GABA.CONTACT_EMAIL + "?subject=" + encodeURIComponent("Solicitud de análisis — " + d.nombre) +
          "&body=" + encodeURIComponent(body);
        say("Se ha abierto tu programa de correo con la solicitud preparada: solo falta pulsar «Enviar». Si no se abre, escríbenos a " + GABA.CONTACT_EMAIL + ".");
        return;
      }

      btn.disabled = true;
      say("Enviando…");
      fetch(GABA.FORM_ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          form.reset();
          say("Gracias. Hemos recibido tu solicitud y te responderemos por email.");
        })
        .catch(function () {
          say("No se ha podido enviar la solicitud. Inténtalo de nuevo o escríbenos a " + GABA.CONTACT_EMAIL + ".", true);
        })
        .then(function () { btn.disabled = false; });
    });
  }
})();
