import { expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { contractId, ids, validateContext } from './product-delivery-probe.mjs';

function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}
function fixture() {
  return {organizationId:'org',projectId:'project',environmentId:'env',
    release:{releaseId:'release',decisionId:'decision',selectionGeneration:'1',rolloutAttempt:1,stage:'DELIVERY_RELEASE_EXECUTION_STAGE_POST_DEPLOYMENT_PROBE'},
    intent:{contractId,requiredAssertionIds:ids,policyRevision:'v1',runnerImageDigest:'sha256:'+'a'.repeat(64),
      targets:[{memberId:'web',origin:'https://learning.example',runtimeObservationDigest:'sha256:'+'b'.repeat(64),
        resourceGeneration:'1',revisionUid:'revision',sourceCommitSha:'c'.repeat(40),sourceRepositoryId:'TseFamily/tse-family-learning'}]}};
}
const digest = v => 'sha256:' + createHash('sha256').update(canonical(v)).digest('hex');
test('context is bound to whole admitted envelope including release and selected origin', () => {
  const input = fixture();
  expect(validateContext(JSON.stringify(input), digest(input))).toEqual(input.intent);
  const old = digest(input);
  input.release.decisionId = 'other';
  expect(() => validateContext(JSON.stringify(input), old)).toThrow('digest');
});
test('rejects contract, missing source identity, duplicate members, and credential-bearing origins', () => {
  for (const mutate of [
    v => v.intent.requiredAssertionIds.pop(),
    v => delete v.intent.targets[0].sourceCommitSha,
    v => v.intent.targets.push({...v.intent.targets[0]}),
    v => v.intent.targets[0].origin = 'https://user:password@learning.example',
    v => v.release.stage = 'DELIVERY_RELEASE_EXECUTION_STAGE_DEPLOY',
  ]) {
    const input = fixture();
    input.intent.requiredAssertionIds = [...ids];
    mutate(input);
    expect(() => validateContext(JSON.stringify(input), digest(input))).toThrow();
  }
});
