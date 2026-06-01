/*
 * engine.js — Moteur de calcul de la calculatrice.
 *
 * Évalue une expression arithmétique SANS utiliser eval() (sécurisé).
 * Algorithme : tokenisation -> Shunting-Yard (notation polonaise inverse) -> évaluation.
 *
 * Compatible navigateur (variable globale `CalcEngine`) ET Node.js (module.exports),
 * ce qui permet de tester le moteur en ligne de commande.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CalcEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Opérateurs binaires : précédence + associativité + fonction de calcul.
  var OPERATORS = {
    "+": { prec: 1, assoc: "L", fn: function (a, b) { return a + b; } },
    "-": { prec: 1, assoc: "L", fn: function (a, b) { return a - b; } },
    "*": { prec: 2, assoc: "L", fn: function (a, b) { return a * b; } },
    "/": { prec: 2, assoc: "L", fn: function (a, b) {
        if (b === 0) throw new Error("Division par zéro");
        return a / b;
      } },
    "%": { prec: 2, assoc: "L", fn: function (a, b) {
        if (b === 0) throw new Error("Division par zéro");
        return a % b;
      } },
    // La puissance est plus prioritaire que le moins unaire :  -2^2 = -(2^2).
    "^": { prec: 4, assoc: "R", fn: function (a, b) { return Math.pow(a, b); } }
  };

  // Précédence / associativité, opérateurs unaires inclus (prec 3 : entre * et ^).
  var PREC = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "u-": 3, "u+": 3, "^": 4 };
  var ASSOC = { "+": "L", "-": "L", "*": "L", "/": "L", "%": "L", "u-": "R", "u+": "R", "^": "R" };

  /**
   * Découpe une chaîne en jetons (nombres, opérateurs, parenthèses).
   * Gère le moins unaire en le transformant en opérateur interne "u-".
   * @param {string} input
   * @returns {Array<{type:string, value:string}>}
   */
  function tokenize(input) {
    var tokens = [];
    var i = 0;
    var n = input.length;

    while (i < n) {
      var c = input[i];

      // Espaces ignorés.
      if (c === " " || c === "\t") { i++; continue; }

      // Nombre : chiffres + un point décimal éventuel.
      if (c >= "0" && c <= "9" || c === ".") {
        var num = "";
        var dotSeen = false;
        while (i < n && ((input[i] >= "0" && input[i] <= "9") || input[i] === ".")) {
          if (input[i] === ".") {
            if (dotSeen) throw new Error("Nombre invalide");
            dotSeen = true;
          }
          num += input[i];
          i++;
        }
        if (num === ".") throw new Error("Nombre invalide");
        tokens.push({ type: "number", value: num });
        continue;
      }

      // Parenthèses.
      if (c === "(") { tokens.push({ type: "lparen", value: c }); i++; continue; }
      if (c === ")") { tokens.push({ type: "rparen", value: c }); i++; continue; }

      // Opérateurs.
      if (OPERATORS.hasOwnProperty(c)) {
        // Détection du moins/plus unaire (début, après un opérateur ou après "(").
        var prev = tokens[tokens.length - 1];
        var isUnary = !prev || prev.type === "operator" || prev.type === "lparen";
        if (isUnary && (c === "-" || c === "+")) {
          tokens.push({ type: "operator", value: c === "-" ? "u-" : "u+" });
        } else {
          tokens.push({ type: "operator", value: c });
        }
        i++;
        continue;
      }

      throw new Error("Caractère invalide : « " + c + " »");
    }

    return tokens;
  }

  /**
   * Convertit une liste de jetons en notation polonaise inverse (Shunting-Yard).
   */
  function toRPN(tokens) {
    var output = [];
    var stack = [];

    for (var k = 0; k < tokens.length; k++) {
      var t = tokens[k];

      if (t.type === "number") {
        output.push(t);
      } else if (t.type === "operator") {
        // Algorithme standard, opérateurs unaires et binaires traités uniformément.
        var o1 = t.value;
        while (stack.length) {
          var top = stack[stack.length - 1];
          if (top.type === "operator" &&
              ((ASSOC[o1] === "L" && PREC[o1] <= PREC[top.value]) ||
               (ASSOC[o1] === "R" && PREC[o1] < PREC[top.value]))) {
            output.push(stack.pop());
          } else {
            break;
          }
        }
        stack.push(t);
      } else if (t.type === "lparen") {
        stack.push(t);
      } else if (t.type === "rparen") {
        var found = false;
        while (stack.length) {
          var s = stack.pop();
          if (s.type === "lparen") { found = true; break; }
          output.push(s);
        }
        if (!found) throw new Error("Parenthèses non équilibrées");
      }
    }

    while (stack.length) {
      var rest = stack.pop();
      if (rest.type === "lparen" || rest.type === "rparen") {
        throw new Error("Parenthèses non équilibrées");
      }
      output.push(rest);
    }

    return output;
  }

  /**
   * Évalue une expression en notation polonaise inverse.
   */
  function evalRPN(rpn) {
    var stack = [];

    for (var k = 0; k < rpn.length; k++) {
      var t = rpn[k];

      if (t.type === "number") {
        stack.push(parseFloat(t.value));
      } else if (t.value === "u-") {
        if (!stack.length) throw new Error("Expression invalide");
        stack.push(-stack.pop());
      } else if (t.value === "u+") {
        if (!stack.length) throw new Error("Expression invalide");
        stack.push(+stack.pop());
      } else {
        var b = stack.pop();
        var a = stack.pop();
        if (a === undefined || b === undefined) throw new Error("Expression invalide");
        stack.push(OPERATORS[t.value].fn(a, b));
      }
    }

    if (stack.length !== 1) throw new Error("Expression invalide");
    var result = stack[0];
    if (!isFinite(result)) throw new Error("Résultat non défini");
    return result;
  }

  /**
   * Point d'entrée : évalue une expression arithmétique et renvoie un nombre.
   * @param {string} expression
   * @returns {number}
   */
  function evaluate(expression) {
    if (expression == null || String(expression).trim() === "") {
      throw new Error("Expression vide");
    }
    var tokens = tokenize(String(expression));
    var rpn = toRPN(tokens);
    return evalRPN(rpn);
  }

  return {
    evaluate: evaluate,
    tokenize: tokenize,
    toRPN: toRPN
  };
});