import test from 'node:test';
import assert from 'node:assert/strict';

import { isMissingStoragePathError } from '../src/reports.ts';

test('ignores missing-file errors from Supabase storage', () => {
  assert.equal(isMissingStoragePathError({ message: 'The resource was not found' }), true);
  assert.equal(isMissingStoragePathError({ message: 'The object does not exist' }), true);
  assert.equal(isMissingStoragePathError({ message: 'Permission denied' }), false);
});
