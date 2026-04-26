#!/usr/bin/env node
/* ============================================================================
   File: tools/run_tests.js
   Purpose: Run the PPM test harness headlessly in Node, without a browser.
   Polyfills the minimal browser globals needed (localStorage, document, crypto,
   window) so that adapters/storage and other modules load correctly.

   Usage:
     node tools/run_tests.js              # run, exit 0 on green
     node tools/run_tests.js --verbose    # also print PASSED tests

   What this DOES test:
     - Domain (pure logic): scheduling, risk, budget, documents, milestones,
       health, validation, dates
     - Schema: shape, defaultState, newProjectId, freeze enforcement
     - Migrations: 1.0 -> 1.1 path
     - Adapters: storage round-trip, exporter JSON/CSV
     - Services: projectService, editService (immutability), lifecycleService,
       commentService, reportService

   What this does NOT test:
     - UI rendering (no real DOM)
     - Click handlers
     - CSS / visual layout
     - Mobile responsive behavior
     - Print output
     - Real localStorage quota behavior

   Exit codes:
     0  all tests passed
     1  one or more tests failed
     2  could not load a module (syntax error or missing dependency)
   ============================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

// -------------------------------------------------------------------------
// BROWSER POLYFILLS
// -------------------------------------------------------------------------
// In-memory localStorage replacement. State persists for the duration of this
// process only — exactly the scope tests need.
let _storage = {};
const localStorage = {
  getItem(k) { return Object.prototype.hasOwnProperty.call(_storage, k) ? _storage[k] : null; },
  setItem(k, v) {
    // Approximate quota: ~5MB. Useful for testing the quota path if we ever add
    // a quota simulation test. For now, no enforcement — tests don't fill it.
    _storage[k] = String(v);
  },
  removeItem(k) { delete _storage[k]; },
  clear() { _storage = {}; }
};

// Minimal document stub. Adapters/exporter calls document.createElement to
// construct download anchors — these never get appended to a body in tests
// (no triggerDownload is called in the test path), so a no-op stub is enough.
const documentStub = {
  createElement() {
    return {
      style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      addEventListener() {},
      appendChild() {},
      querySelectorAll() { return []; },
      querySelector() { return null; },
      click() {},
      remove() {}
    };
  },
  addEventListener() {},
  body: { appendChild() {}, removeChild() {} },
  readyState: 'complete'
};

// crypto.randomUUID: use Node's webcrypto if available, otherwise approximate.
let cryptoStub;
try {
  cryptoStub = require('crypto').webcrypto;
} catch (_) {
  cryptoStub = null;
}
if (!cryptoStub || typeof cryptoStub.randomUUID !== 'function') {
  cryptoStub = {
    randomUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };
}

// Window. The modules attach PPM to window. Use a single object as both
// `global` and `window`.
global.window = global;
global.document = documentStub;
global.localStorage = localStorage;

// Node 22+ exposes `global.crypto` as a getter-only property. We cannot
// directly assign to it. If global.crypto already exists with a usable
// randomUUID (Node 19+), keep it. Otherwise, define our shim with
// Object.defineProperty (overwrites the getter).
if (!global.crypto || typeof global.crypto.randomUUID !== 'function') {
  Object.defineProperty(global, 'crypto', {
    value: cryptoStub,
    writable: true,
    configurable: true
  });
}

global.URL = global.URL || { createObjectURL() { return 'blob://test'; }, revokeObjectURL() {} };
global.Blob = global.Blob || function (parts) { return { parts: parts }; };

// -------------------------------------------------------------------------
// MODULE LOAD ORDER
// -------------------------------------------------------------------------
// Strict dependency order. Same order as index.html's script tags but
// excludes UI modules — the test harness doesn't load UI.
const MODULE_ORDER = [
  'src/ppm.js',
  'src/config/rules.js',
  'src/schema/schema.js',
  'src/schema/migrations.js',
  'src/domain/dates.js',
  'src/domain/scheduling.js',
  'src/domain/risk.js',
  'src/domain/budget.js',
  'src/domain/documents.js',
  'src/domain/milestones.js',
  'src/domain/health.js',
  'src/domain/validation.js',
  'src/adapters/storage.js',
  'src/adapters/exporter.js',
  'src/adapters/printer.js',
  'src/services/events.js',
  'src/services/projectService.js',
  'src/services/editService.js',
  'src/services/lifecycleService.js',
  'src/services/commentService.js',
  'src/services/reportService.js',
  'src/services/viewService.js',
  'src/test/test.js'
];

// -------------------------------------------------------------------------
// COLOR HELPERS (TTY-only)
// -------------------------------------------------------------------------
const isTTY = process.stdout.isTTY;
function green(s) { return isTTY ? '\x1b[32m' + s + '\x1b[0m' : s; }
function red(s)   { return isTTY ? '\x1b[31m' + s + '\x1b[0m' : s; }
function dim(s)   { return isTTY ? '\x1b[2m'  + s + '\x1b[0m' : s; }
function bold(s)  { return isTTY ? '\x1b[1m'  + s + '\x1b[0m' : s; }

// -------------------------------------------------------------------------
// MAIN
// -------------------------------------------------------------------------
const verbose = process.argv.indexOf('--verbose') >= 0 || process.argv.indexOf('-v') >= 0;
const projectRoot = path.resolve(__dirname, '..');

console.log(bold('PPM headless test runner'));
console.log(dim('Loading ' + MODULE_ORDER.length + ' modules from ' + projectRoot));
console.log('');

// Load modules
for (const relPath of MODULE_ORDER) {
  const absPath = path.join(projectRoot, relPath);
  let code;
  try {
    code = fs.readFileSync(absPath, 'utf8');
  } catch (e) {
    console.error(red('LOAD FAILED ') + relPath + ': ' + e.message);
    process.exit(2);
  }
  try {
    // Run in current global scope so PPM.* attaches to global
    // Wrap in a function so const/let don't leak between modules.
    new Function(code).call(global);
  } catch (e) {
    console.error(red('EVAL FAILED ') + relPath + ': ' + e.message);
    if (e.stack) console.error(dim(e.stack.split('\n').slice(1, 4).join('\n')));
    process.exit(2);
  }
}

// Sanity check
if (!global.PPM || !global.PPM.test || typeof global.PPM.test.runAll !== 'function') {
  console.error(red('PPM.test.runAll not found — module loading produced unexpected state'));
  process.exit(2);
}

// Run
let results;
const startTime = Date.now();
try {
  results = global.PPM.test.runAll();
} catch (e) {
  console.error(red('TEST RUNNER THREW: ') + e.message);
  if (e.stack) console.error(dim(e.stack));
  process.exit(2);
}
const elapsedMs = Date.now() - startTime;

// -------------------------------------------------------------------------
// EXTRA: UI architecture filesystem scan (Node-only, since the test file
// itself can't run XHR in Node — that path runs in the browser).
// -------------------------------------------------------------------------
const uiFiles = [
  'src/ui/columns.js',
  'src/ui/grid.js',
  'src/ui/detail.js',
  'src/ui/shell.js',
  'src/ui/wizard.js',
  'src/ui/banner.js',
  'src/ui/welcome.js',
  'src/ui/router.js',
  'src/ui/toast.js',
  'src/ui/icons.js',
  'src/ui/boot.js',
  'src/ui/dashboard.js',
  'src/ui/steerco.js'
];

for (const f of uiFiles) {
  const abs = path.join(projectRoot, f);
  if (!fs.existsSync(abs)) continue;
  let src;
  try {
    src = fs.readFileSync(abs, 'utf8');
  } catch (e) {
    continue;
  }
  // Strip /* ... */ block comments and // line comments
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  const checks = [
    { pattern: /PPM\.domain\./,    label: 'ARCH UI [fs]: ' + f + ' has no direct PPM.domain.* code references' },
    { pattern: /PPM\.adapters\./,  label: 'ARCH UI [fs]: ' + f + ' has no direct PPM.adapters.* code references' },
    { pattern: /\blocalStorage\b/, label: 'ARCH UI [fs]: ' + f + ' has no direct localStorage references' }
  ];
  checks.forEach(function(c){
    const ok = !c.pattern.test(stripped);
    results.push({ ok: ok, label: c.label });
  });
}

const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok);

// Output
if (verbose) {
  console.log(green('PASSED:'));
  results.filter(r => r.ok).forEach(r => console.log('  ' + green('✓') + ' ' + r.label));
  console.log('');
}

if (failed.length > 0) {
  console.log(red('FAILED:'));
  failed.forEach(r => console.log('  ' + red('✗') + ' ' + r.label));
  console.log('');
}

const summary = passed + '/' + results.length + ' passed';
const summaryStr = failed.length === 0
  ? green(bold(summary))
  : red(bold(summary));

console.log(summaryStr + dim(' in ' + elapsedMs + 'ms'));

process.exit(failed.length === 0 ? 0 : 1);
