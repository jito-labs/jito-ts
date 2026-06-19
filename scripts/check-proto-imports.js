'use strict';

/*
 * Guards the fix for issue #56:
 * https://github.com/jito-labs/jito-ts/issues/56
 *
 * The generated protobuf files import two CommonJS deps, `protobufjs/minimal`
 * and `long`. Neither has a `default` export. With default-import syntax
 * (`import _m0 from "protobufjs/minimal"` / `import Long from "long"`) the code
 * only works when transpiled with esModuleInterop. Consumers that transpile the
 * source without it (some ts-node setups) get `minimal_1.default === undefined`
 * and crash: TypeError: Cannot read properties of undefined (reading 'util').
 *
 * The safe, interop-agnostic forms are:
 *   import * as _m0 from "protobufjs/minimal";  // member access only
 *   import Long = require("long");               // value + type, import-equals
 *
 * This check fails the build if a regeneration or hand edit reintroduces a
 * fragile import. Run via `npm run check-proto-imports`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GEN_DIR = path.join(ROOT, 'src', 'gen');

// Each pattern matches any import alias, not just the names ts-proto emits, so a
// renamed regeneration cannot slip a fragile import past the guard.
const FORBIDDEN = [
  {
    // default import of a CJS module -> resolves to `.default` (undefined)
    // without esModuleInterop.
    re: /^import\s+\w+\s+from\s+["']protobufjs\/minimal["']/m,
    fix: 'use `import * as _m0 from "protobufjs/minimal"`',
  },
  {
    re: /^import\s+\w+\s+from\s+["']long["']/m,
    fix: 'use `import Long = require("long")`',
  },
  {
    // ts-proto's esModuleInterop=false output; fails type-check (TS2497)
    // against @types/long's `export =`. The gen scripts rewrite it to
    // import-equals; this catches the case where that rewrite did not run.
    re: /^import\s+\*\s+as\s+\w+\s+from\s+["']long["']/m,
    fix: 'use `import Long = require("long")`',
  },
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(GEN_DIR)) {
    console.error('check-proto-imports: src/gen not found');
    process.exitCode = 1;
    return;
  }

  const files = walk(GEN_DIR);
  const violations = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const {re, fix} of FORBIDDEN) {
      if (re.test(src)) {
        violations.push(`  ${path.relative(ROOT, file)}: ${fix}`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('check-proto-imports: fragile default imports (see #56):');
    console.error(violations.join('\n'));
    process.exitCode = 1;
    return;
  }

  console.log(`check-proto-imports: ${files.length} generated files OK.`);
}

main();
