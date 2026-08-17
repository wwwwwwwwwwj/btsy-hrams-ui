import assert from 'node:assert/strict';
import fs from 'node:fs';

const file = fs.readFileSync(new URL('../src/views/hrams/utilize/components/utilize-records-panel.vue', import.meta.url), 'utf8');

assert.match(file, /type="datetime"/);
assert.match(file, /formatLocalDateTime\(/);
assert.doesNotMatch(file, /formatLocalDate\(/);

console.log('utilize return-time regression check passed');
