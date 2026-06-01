# Basic Calculator (Node.js)

A minimal calculator with four operations — `add`, `subtract`, `multiply`,
`divide` — plus division-by-zero handling, a command-line interface, and unit
tests written with the built-in `node:test` runner. No external dependencies.

## Requirements

- Node.js >= 18 (developed/tested on Node 22)

## CLI usage

```bash
node calc.js <operation> <a> <b>
```

Where `<operation>` is one of `add`, `subtract`, `multiply`, `divide`.

### Examples

```bash
node calc.js add 2 3        # 5
node calc.js subtract 10 4  # 6
node calc.js multiply 6 7   # 42
node calc.js divide 20 5    # 4
```

### Error handling

```bash
node calc.js divide 5 0     # Error: Division by zero is not allowed
node calc.js add 2          # Error: Usage: node calc.js <add|subtract|multiply|divide> <a> <b>
node calc.js add foo 3      # Error: Both operands must be valid numbers (got "foo" and "3")
```

Errors are printed to `stderr` and the process exits with code `1`.

## Use as a module

```js
const { add, subtract, multiply, divide, calculate } = require('./calc');

add(2, 3);                 // 5
calculate('multiply', 6, 7); // 42
```

## Running the tests

```bash
npm test
# or
node --test
```