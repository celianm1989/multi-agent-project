'use strict';

/**
 * Basic calculator module.
 * Exposes the four arithmetic operations plus helpers used by the CLI.
 */

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return a / b;
}

const operations = { add, subtract, multiply, divide };

/**
 * Run a named operation against two numeric operands.
 * @param {string} op - One of: add, subtract, multiply, divide.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function calculate(op, a, b) {
  const fn = operations[op];
  if (!fn) {
    throw new Error(
      `Unknown operation: "${op}". Valid operations: ${Object.keys(operations).join(', ')}`
    );
  }
  return fn(a, b);
}

/**
 * Parse CLI arguments and compute a result.
 * @param {string[]} args - Typically process.argv.slice(2).
 * @returns {number}
 */
function runCli(args) {
  const [op, aRaw, bRaw] = args;

  if (!op || aRaw === undefined || bRaw === undefined) {
    throw new Error(
      'Usage: node calc.js <add|subtract|multiply|divide> <a> <b>\n' +
        'Example: node calc.js add 2 3'
    );
  }

  const a = Number(aRaw);
  const b = Number(bRaw);

  if (Number.isNaN(a) || Number.isNaN(b)) {
    throw new Error(`Both operands must be valid numbers (got "${aRaw}" and "${bRaw}")`);
  }

  return calculate(op, a, b);
}

if (require.main === module) {
  try {
    const result = runCli(process.argv.slice(2));
    console.log(result);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { add, subtract, multiply, divide, calculate, runCli };