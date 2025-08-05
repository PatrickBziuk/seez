import { test } from 'node:test';
import assert from 'node:assert';
import { computeContentSha } from './translation';

test('computeContentSha produces stable SHA256 hash', () => {
  const md = `---
title: Test
language: en
---

# Hello

Sample content.
`;
  const sha1 = computeContentSha(md);
  const sha2 = computeContentSha(md);
  assert.strictEqual(sha1, sha2);
  assert.match(sha1, /^[0-9a-f]{64}$/);
});
