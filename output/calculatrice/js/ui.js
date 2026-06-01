/*
 * ui.js — Interface graphique dynamique de la calculatrice.
 *
 * - Le clavier est généré dynamiquement à partir d'une configuration (KEYS).
 * - Aperçu du résultat en direct pendant la saisie.
 * - Historique des calculs, support du clavier physique, thème clair/sombre.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configuration du clavier : chaque touche est un objet décrivant son rendu
  // et son action. Modifier ce tableau suffit à changer la disposition.
  // ---------------------------------------------------------------------------
  var KEYS = [
    { label: "AC",  type: "action", action: "clear",     variant: "func" },
    { label: "⌫",   type: "action", action: "backspace", variant: "func", key: "Backspace" },
    { label: "( )", type: "action", action: "paren",     variant: "func" },
    { label: "÷",   type: "op",     value: "/",          variant: "op",   key: "/" },

    { label: "7", type: "digit", value: "7" },
    { label: "8", type: "digit", value: "8" },
    { label: "9", type: "digit", value: "9" },
    { label: "×", type: "op",    value: "*", variant: "op", key: "*" },

    { label: "4", type: "digit", value: "4" },
    { label: "5", type: "digit", value: "5" },
    { label: "6", type: "digit", value: "6" },
    { label: "−", type: "op",    value: "-", variant: "op", key: "-" },

    { label: "1", type: "digit", value: "1" },
    { label: "2", type: "digit", value: "2" },
    { label: "3", type: "digit", value: "3" },
    { label: "+", type: "op",    value: "+", variant: "op", key: "+" },

    { label: "%", type: "op",    value: "%", variant: "func" },
    { label: "0", type: "digit", value: "0" },
    { label: ".", type: "digit", value: "." },
    { label: "=", type: "action", action: "equals", variant: "equals", key: "Enter" }
  ];

  // État applicatif.
  var expression = "";
  var lastResultShown = false;

  // Références DOM (renseignées après chargement).
  var els = {};

  // ---------------------------------------------------------------------------
  // Construction dynamique du clavier
  // ---------------------------------------------------------------------------
  function buildKeypad() {
    var keypad = els.keypad;
    keypad.innerHTML = "";

    KEYS.forEach(function (k) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key" + (k.variant ? " key--" + k.variant : "");
      btn.textContent = k.label;
      btn.setAttribute("aria-label", k.label);
      btn.addEventListener("click", function () {
        handleKey(k);
        flash(btn);
      });
      keypad.appendChild(btn);
      k._el = btn; // mémorisé pour l'effet visuel via clavier physique
    });
  }

  // ---------------------------------------------------------------------------
  // Logique des touches
  // ---------------------------------------------------------------------------
  function handleKey(k) {
    switch (k.type) {
      case "digit":
        if (lastResultShown && /[0-9.]/.test(k.value)) { expression = ""; }
        lastResultShown = false;
        expression += k.value;
        break;

      case "op":
        // Après un résultat, on continue le calcul à partir de celui-ci.
        lastResultShown = false;
        if (expression === "" && k.value !== "-") return;
        expression += k.value;
        break;

      case "action":
        doAction(k.action);
        break;
    }
    render();
  }

  function doAction(action) {
    switch (action) {
      case "clear":
        expression = "";
        lastResultShown = false;
        break;

      case "backspace":
        expression = expression.slice(0, -1);
        lastResultShown = false;
        break;

      case "paren":
        expression += chooseParen();
        lastResultShown = false;
        break;

      case "equals":
        compute();
        break;
    }
  }

  // Choisit intelligemment entre "(" et ")".
  function chooseParen() {
    var opens = (expression.match(/\(/g) || []).length;
    var closes = (expression.match(/\)/g) || []).length;
    var last = expression.slice(-1);
    if (expression === "" || last === "(" || /[+\-*/%^]/.test(last)) {
      return "(";
    }
    if (opens > closes && /[0-9.)]/.test(last)) {
      return ")";
    }
    return "(";
  }

  function compute() {
    if (expression.trim() === "") return;
    try {
      var result = CalcEngine.evaluate(expression);
      var formatted = formatNumber(result);
      addHistory(expression, formatted);
      expression = formatted;
      lastResultShown = true;
      clearError();
    } catch (e) {
      showError(e.message || "Erreur");
    }
  }

  // ---------------------------------------------------------------------------
  // Affichage
  // ---------------------------------------------------------------------------
  function render() {
    els.expr.textContent = expression || "0";

    // Aperçu en direct du résultat (sans planter sur une saisie incomplète).
    if (expression && !lastResultShown) {
      try {
        var preview = CalcEngine.evaluate(expression);
        els.preview.textContent = "= " + formatNumber(preview);
      } catch (e) {
        els.preview.textContent = "";
      }
    } else {
      els.preview.textContent = "";
    }
  }

  function formatNumber(n) {
    if (!isFinite(n)) return "Erreur";
    // Arrondi pour limiter les artefacts de virgule flottante.
    var rounded = Math.round((n + Number.EPSILON) * 1e10) / 1e10;
    var str = String(rounded);
    // Notation lisible pour les très grands / petits nombres.
    if (Math.abs(rounded) >= 1e15 || (rounded !== 0 && Math.abs(rounded) < 1e-9)) {
      str = rounded.toExponential(6);
    }
    return str;
  }

  function showError(msg) {
    els.preview.textContent = "⚠ " + msg;
    els.preview.classList.add("preview--error");
  }

  function clearError() {
    els.preview.classList.remove("preview--error");
  }

  function flash(btn) {
    btn.classList.add("key--active");
    setTimeout(function () { btn.classList.remove("key--active"); }, 90);
  }

  // ---------------------------------------------------------------------------
  // Historique
  // ---------------------------------------------------------------------------
  function addHistory(expr, result) {
    var li = document.createElement("li");
    li.className = "history__item";

    var e = document.createElement("span");
    e.className = "history__expr";
    e.textContent = expr;

    var r = document.createElement("span");
    r.className = "history__result";
    r.textContent = "= " + result;

    li.appendChild(e);
    li.appendChild(r);

    // Cliquer sur une ligne réutilise son résultat.
    li.addEventListener("click", function () {
      expression = result;
      lastResultShown = true;
      render();
    });

    els.history.insertBefore(li, els.history.firstChild);
    els.historyEmpty.style.display = "none";
  }

  function clearHistory() {
    els.history.innerHTML = "";
    els.historyEmpty.style.display = "";
  }

  // ---------------------------------------------------------------------------
  // Clavier physique
  // ---------------------------------------------------------------------------
  function bindKeyboard() {
    document.addEventListener("keydown", function (ev) {
      var handled = false;

      if (ev.key >= "0" && ev.key <= "9") {
        handleKey({ type: "digit", value: ev.key });
        flashByValue(ev.key);
        handled = true;
      } else if (ev.key === ".") {
        handleKey({ type: "digit", value: "." });
        handled = true;
      } else if ("+-*/%".indexOf(ev.key) !== -1) {
        handleKey({ type: "op", value: ev.key });
        flashByKey(ev.key);
        handled = true;
      } else if (ev.key === "(" || ev.key === ")") {
        expression += ev.key;
        lastResultShown = false;
        render();
        handled = true;
      } else if (ev.key === "Enter" || ev.key === "=") {
        handleKey({ type: "action", action: "equals" });
        handled = true;
      } else if (ev.key === "Backspace") {
        handleKey({ type: "action", action: "backspace" });
        handled = true;
      } else if (ev.key === "Escape" || (ev.key && ev.key.toLowerCase() === "c")) {
        handleKey({ type: "action", action: "clear" });
        handled = true;
      }

      if (handled) ev.preventDefault();
    });
  }

  function flashByValue(value) {
    KEYS.forEach(function (k) { if (k.value === value && k._el) flash(k._el); });
  }
  function flashByKey(key) {
    KEYS.forEach(function (k) { if (k.value === key && k._el) flash(k._el); });
  }

  // ---------------------------------------------------------------------------
  // Thème clair / sombre
  // ---------------------------------------------------------------------------
  function bindTheme() {
    var saved = null;
    try { saved = localStorage.getItem("calc-theme"); } catch (e) {}
    if (saved === "light") document.body.classList.add("theme-light");

    els.themeToggle.addEventListener("click", function () {
      document.body.classList.toggle("theme-light");
      var mode = document.body.classList.contains("theme-light") ? "light" : "dark";
      try { localStorage.setItem("calc-theme", mode); } catch (e) {}
    });
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------
  function init() {
    els.keypad = document.getElementById("keypad");
    els.expr = document.getElementById("expression");
    els.preview = document.getElementById("preview");
    els.history = document.getElementById("history");
    els.historyEmpty = document.getElementById("history-empty");
    els.themeToggle = document.getElementById("theme-toggle");
    els.clearHistory = document.getElementById("clear-history");

    buildKeypad();
    bindKeyboard();
    bindTheme();
    els.clearHistory.addEventListener("click", clearHistory);

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();