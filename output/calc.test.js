'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { add, subtract, multiply, divide, calculate, runCli } = require('./calc');

test('add', async (t) => {
  await t.test('adds two positive numbers', () => {
    assert.strictEqual(add(2, 3), 5);
  });
  await t.test('adds negative numbers', () => {
    assert.strictEqual(add(-4, -6), -10);
  });
  await t.test('handles decimals', () => {
    assert.strictEqual(add(0.1, 0.2).toFixed(2), '0.30');
  });
});

test('subtract', async (t) => {
  await t.test('subtracts two numbers', () => {
    assert.strictEqual(subtract(10, 4), 6);
  });
  await t.test('can produce a negative result', () => {
    assert.strictEqual(subtract(4, 10), -6);
  });
});

test('multiply', async (t) => {
  await t.test('multiplies two numbers', () => {
    assert.strictEqual(multiply(6, 7), 42);
  });
  await t.test('multiplying by zero yields zero', () => {
    assert.strictEqual(multiply(99, 0), 0);
  });
});

test('divide', async (t) => {
  await t.test('divides two numbers', () => {
    assert.strictEqual(divide(20, 5), 4);
  });
  await t.test('throws on division by zero', () => {
    assert.throws(() => divide(1, 0), /Division by zero is not allowed/);
  });
});

test('calculate', async (t) => {
  await t.test('dispatches to the right operation', () => {
    assert.strictEqual(calculate('multiply', 3, 4), 12);
  });
  await t.test('throws on an unknown operation', () => {
    assert.throws(() => calculate('modulo', 5, 2), /Unknown operation/);
  });
});

test('runCli', async (t) => {
  await t.test('computes from string args (node calc.js add 2 3)', () => {
    assert.strictEqual(runCli(['add', '2', '3']), 5);
  });
  await t.test('throws when arguments are missing', () => {
    assert.throws(() => runCli(['add', '2']), /Usage:/);
  });
  await t.test('throws on non-numeric operands', () => {
    assert.throws(() => runCli(['add', 'foo', '3']), /valid numbers/);
  });
  await t.test('propagates division-by-zero error', () => {
    assert.throws(() => runCli(['divide', '5', '0']), /Division by zero/);
  });
});