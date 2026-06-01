/*
 * engine.test.js — Tests du moteur de calcul (exécutables avec Node, sans dépendance).
 * Lancement : node test/engine.test.js
 */
var CalcEngine = require("../js/engine.js");

var passed = 0;
var failed = 0;

function approx(a, b) {
  return Math.abs(a - b) < 1e-9;
}

function expect(expr, value) {
  var got;
  try {
    got = CalcEngine.evaluate(expr);
  } catch (e) {
    console.log("✗ " + expr + "  -> a levé une erreur : " + e.message);
    failed++;
    return;
  }
  if (approx(got, value)) {
    passed++;
  } else {
    console.log("✗ " + expr + "  attendu " + value + ", obtenu " + got);
    failed++;
  }
}

function expectError(expr) {
  try {
    var got = CalcEngine.evaluate(expr);
    console.log("✗ " + expr + "  aurait dû échouer, obtenu " + got);
    failed++;
  } catch (e) {
    passed++;
  }
}

// --- Opérations de base ---
expect("1+1", 2);
expect("2-3", -1);
expect("4*5", 20);
expect("10/4", 2.5);
expect("10%3", 1);

// --- Priorité des opérateurs ---
expect("2+3*4", 14);
expect("2*3+4", 10);
expect("2+3*4-1", 13);
expect("100/10/2", 5);

// --- Parenthèses ---
expect("(2+3)*4", 20);
expect("2*(3+(4-1))", 12);
expect("((1+2)*(3+4))", 21);

// --- Décimaux ---
expect("0.1+0.2", 0.3);
expect("3.5*2", 7);
expect(".5+.5", 1);

// --- Moins / plus unaire ---
expect("-5+3", -2);
expect("-(2+3)", -5);
expect("3*-2", -6);
expect("+4", 4);
expect("-2^2", -4); // = -(2^2)

// --- Puissance (associativité à droite) ---
expect("2^3", 8);
expect("2^2^3", 256); // 2^(2^3)

// --- Espaces ---
expect("  7  +  8  ", 15);

// --- Erreurs attendues ---
expectError("1/0");
expectError("2+");
expectError("(1+2");
expectError("1+2)");
expectError("");
expectError("3..5");
expectError("abc");

// --- Résumé ---
console.log("\n" + passed + " test(s) réussi(s), " + failed + " échec(s).");
process.exit(failed === 0 ? 0 : 1);