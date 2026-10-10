import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('example environment never contains a Google API key', async () => {
  const example = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
  assert.doesNotMatch(example, /A[I]za[A-Za-z0-9_-]{35}/);
  assert.match(example, /VITE_FIREBASE_API_KEY=replace-with-your-firebase-web-api-key/);
});
