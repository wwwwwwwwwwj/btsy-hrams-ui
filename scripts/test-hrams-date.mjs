import assert from 'node:assert/strict';
import { formatLocalDateTime } from '../src/utils/hrams-date.js';

const utcInstant = new Date('2026-08-17T02:21:00.000Z');
assert.equal(formatLocalDateTime(utcInstant), '2026-08-17 10:21:00');

console.log('hrams-date tests passed');
