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

test('sold Apps [[services]] row is typeless', () => {
  const config = require('../sylphx.toml');
  const rows = Array.isArray(config.services) ? config.services : [config.services];
  expect(rows).toHaveLength(1);
  expect(rows[0].name).toBe('web');
  expect(rows[0]).not.toHaveProperty('type');
  expect(rows[0]).not.toHaveProperty('build_only');
  expect(rows[0]).not.toHaveProperty('buildOnly');
});
