#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const targets = {
  unit: {
    label: 'Unit',
    dir: join(root, 'coverage', 'unit'),
    primary: 'lines',
    note: null,
  },
  e2e: {
    label: 'E2E',
    dir: join(root, 'coverage', 'e2e'),
    primary: 'funcs',
    note: 'Function coverage is the useful signal. Line % is inflated by extension activation/module load and is shown only as context.',
  },
};

const pct = (hit, total) => {
  if (total === 0) {
    return 'n/a';
  }
  return `${((100 * hit) / total).toFixed(1)}%`;
};

const bucketKey = (filePath) => {
  const normalized = filePath.replaceAll('\\', '/');
  const parts = normalized.split('/');
  const srcIndex = parts.lastIndexOf('src');
  if (srcIndex < 0) {
    return dirname(normalized) || '.';
  }

  const fromSrc = parts.slice(srcIndex);

  if (fromSrc.length === 2) {
    return fromSrc.join('/');
  }

  if (fromSrc.length >= 3) {
    return fromSrc.slice(0, 3).join('/');
  }

  return 'src';
};

const parseLcov = (lcovPath) => {
  const folders = new Map();
  let currentFile = '';
  let linesFound = 0;
  let linesHit = 0;
  let branchesFound = 0;
  let branchesHit = 0;
  let functionsFound = 0;
  let functionsHit = 0;

  const commit = () => {
    if (!currentFile) {
      return;
    }
    const key = bucketKey(currentFile);
    const bucket = folders.get(key) ?? {
      linesFound: 0,
      linesHit: 0,
      branchesFound: 0,
      branchesHit: 0,
      functionsFound: 0,
      functionsHit: 0,
    };
    bucket.linesFound += linesFound;
    bucket.linesHit += linesHit;
    bucket.branchesFound += branchesFound;
    bucket.branchesHit += branchesHit;
    bucket.functionsFound += functionsFound;
    bucket.functionsHit += functionsHit;
    folders.set(key, bucket);
    currentFile = '';
    linesFound = 0;
    linesHit = 0;
    branchesFound = 0;
    branchesHit = 0;
    functionsFound = 0;
    functionsHit = 0;
  };

  for (const line of readFileSync(lcovPath, 'utf8').split(/\r?\n/)) {
    if (line.startsWith('SF:')) {
      commit();
      const absolute = line.slice(3);
      currentFile = relative(root, absolute).replaceAll('\\', '/');
      if (currentFile.startsWith('..')) {
        currentFile = absolute.replaceAll('\\', '/');
      }
    } else if (line.startsWith('LF:')) {
      linesFound = Number(line.slice(3));
    } else if (line.startsWith('LH:')) {
      linesHit = Number(line.slice(3));
    } else if (line.startsWith('BRF:')) {
      branchesFound = Number(line.slice(4));
    } else if (line.startsWith('BRH:')) {
      branchesHit = Number(line.slice(4));
    } else if (line.startsWith('FNF:')) {
      functionsFound = Number(line.slice(4));
    } else if (line.startsWith('FNH:')) {
      functionsHit = Number(line.slice(4));
    } else if (line === 'end_of_record') {
      commit();
    }
  }
  commit();
  return folders;
};

const emptyTotals = () => ({
  linesFound: 0,
  linesHit: 0,
  branchesFound: 0,
  branchesHit: 0,
  functionsFound: 0,
  functionsHit: 0,
});

const addBucket = (acc, bucket) => {
  acc.linesFound += bucket.linesFound;
  acc.linesHit += bucket.linesHit;
  acc.branchesFound += bucket.branchesFound;
  acc.branchesHit += bucket.branchesHit;
  acc.functionsFound += bucket.functionsFound;
  acc.functionsHit += bucket.functionsHit;
  return acc;
};

const formatRow = (name, width, bucket, primary) => {
  const lines = pct(bucket.linesHit, bucket.linesFound).padStart(6);
  const branch = pct(bucket.branchesHit, bucket.branchesFound).padStart(6);
  const funcs = pct(bucket.functionsHit, bucket.functionsFound).padStart(6);

  if (primary === 'funcs') {
    return `${name.padEnd(width)}  ${funcs}  ${branch}  ${lines}`;
  }

  return `${name.padEnd(width)}  ${lines}  ${branch}  ${funcs}`;
};

const printReport = (kind) => {
  const target = targets[kind];
  if (!target) {
    throw new Error(`Unknown coverage target: ${kind}`);
  }

  mkdirSync(target.dir, { recursive: true });
  writeFileSync(join(target.dir, '.gitkeep'), '');
  const lcovPath = join(target.dir, 'lcov.info');
  const htmlPath = join(target.dir, 'index.html');

  if (!existsSync(lcovPath)) {
    console.log(`${target.label} coverage: missing ${relative(root, lcovPath)}`);
    return false;
  }

  const folders = parseLcov(lcovPath);
  const rows = [...folders.entries()]
    .filter(
      ([, bucket]) =>
        bucket.linesFound + bucket.branchesFound + bucket.functionsFound > 0,
    )
    .sort(([a], [b]) => a.localeCompare(b));
  const totals = rows.reduce((acc, [, bucket]) => addBucket(acc, bucket), emptyTotals());
  const nameWidth = Math.max(18, ...rows.map(([name]) => name.length), 5);
  const primary = target.primary;
  const header =
    primary === 'funcs'
      ? `${'Path'.padEnd(nameWidth)}   Funcs  Branch   Lines`
      : `${'Path'.padEnd(nameWidth)}   Lines  Branch   Funcs`;

  console.log(`\n${target.label} coverage by path`);
  if (target.note) {
    console.log(target.note);
  }
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const [name, bucket] of rows) {
    console.log(formatRow(name, nameWidth, bucket, primary));
  }

  console.log('-'.repeat(header.length));
  console.log(formatRow('TOTAL', nameWidth, totals, primary));
  console.log(`Reports: ${relative(root, target.dir)}/`);
  console.log(`HTML:    ${htmlPath}`);
  return true;
};

const selected = process.argv.slice(2);
const kinds = selected.length > 0 ? selected : Object.keys(targets);
let found = false;
for (const kind of kinds) {
  found = printReport(kind) || found;
}

if (!found) {
  console.error('No coverage reports found. Run npm run test:coverage first.');
  process.exit(1);
}
