import { expect, test } from 'bun:test';

test('validate static app', async () => {
  const proc = Bun.spawn(['bun', 'scripts/validate.mjs'], {
    stdout: 'inherit',
    stderr: 'inherit',
  });
  expect(await proc.exited).toBe(0);
});

test('public-path oracle', async () => {
  const proc = Bun.spawn(['bun', 'scripts/assert-public-path.cjs'], {
    stdout: 'inherit',
    stderr: 'inherit',
  });
  expect(await proc.exited).toBe(0);
});
