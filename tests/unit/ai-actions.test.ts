import { describe, expect, it } from 'vitest';
import { AI_ACTIONS, isAiActionName } from '@/lib/ai/actions';

/**
 * The AI action allowlist.
 *
 * This is the table that decides where a model-proposed write goes and what
 * shape it may carry. Everything the copilot can do to the backend passes
 * through it, so a hole here is a hole in the whole confirm flow.
 */
describe('isAiActionName', () => {
  it('accepts the declared actions', () => {
    expect(isAiActionName('record_payment')).toBe(true);
    expect(isAiActionName('enroll_student')).toBe(true);
  });

  it('rejects anything not declared', () => {
    expect(isAiActionName('delete_student')).toBe(false);
    expect(isAiActionName('record_payments')).toBe(false);
    expect(isAiActionName('')).toBe(false);
  });

  it('rejects inherited property names', () => {
    // `'constructor' in AI_ACTIONS` is true; Object.hasOwn is what makes this
    // false, and the difference is whether a crafted action name resolves to
    // a truthy object the route then reads `.path` off.
    for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
      expect(isAiActionName(name), `${name} must not be an action`).toBe(false);
    }
  });

  it('rejects non-string input', () => {
    for (const value of [null, undefined, 42, {}, [], true]) {
      expect(isAiActionName(value)).toBe(false);
    }
  });
});

describe('record_payment schema', () => {
  const parse = (payload: unknown) => AI_ACTIONS.record_payment.schema.safeParse(payload);

  it('accepts a well-formed payment', () => {
    expect(parse({ student_id: 'stu_1', amount: 500_000, method: 'CASH' }).success).toBe(true);
  });

  it('refuses a negative or zero amount', () => {
    // A confirmed payment must not be able to execute as a refund.
    expect(parse({ student_id: 'stu_1', amount: -500_000, method: 'CASH' }).success).toBe(false);
    expect(parse({ student_id: 'stu_1', amount: 0, method: 'CASH' }).success).toBe(false);
  });

  it('refuses an amount that is not a finite number', () => {
    for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, '500000']) {
      expect(parse({ student_id: 'stu_1', amount, method: 'CASH' }).success).toBe(false);
    }
  });

  it('caps the amount, because the model reads these out of free text', () => {
    expect(parse({ student_id: 'stu_1', amount: 2_000_000_000, method: 'CASH' }).success).toBe(false);
  });

  it('refuses an unknown payment method', () => {
    expect(parse({ student_id: 'stu_1', amount: 1000, method: 'CRYPTO' }).success).toBe(false);
    expect(parse({ student_id: 'stu_1', amount: 1000 }).success).toBe(false);
  });

  it('refuses an empty student id', () => {
    // Some backends read an empty filter as "all rows".
    expect(parse({ student_id: '', amount: 1000, method: 'CASH' }).success).toBe(false);
    expect(parse({ student_id: '   ', amount: 1000, method: 'CASH' }).success).toBe(false);
  });

  it('drops undeclared fields instead of forwarding them', () => {
    const result = parse({
      student_id: 'stu_1',
      amount: 1000,
      method: 'CASH',
      organization_id: 'someone-elses-org',
      status: 'CONFIRMED',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('organization_id');
      expect(result.data).not.toHaveProperty('status');
    }
  });
});

describe('enroll_student schema', () => {
  const parse = (payload: unknown) => AI_ACTIONS.enroll_student.schema.safeParse(payload);

  it('accepts an enrolment with and without a fee', () => {
    expect(parse({ student_id: 's1', group_id: 'g1' }).success).toBe(true);
    expect(parse({ student_id: 's1', group_id: 'g1', monthly_fee: 400_000 }).success).toBe(true);
  });

  it('requires both ids', () => {
    expect(parse({ student_id: 's1' }).success).toBe(false);
    expect(parse({ group_id: 'g1' }).success).toBe(false);
  });

  it('refuses a negative fee', () => {
    expect(parse({ student_id: 's1', group_id: 'g1', monthly_fee: -1 }).success).toBe(false);
  });
});

describe('the allowlist itself', () => {
  it('declares no path that could escape the backend prefix', () => {
    // Paths are interpolated into `${BACKEND_URL}/api/${path}`; a leading
    // slash or a traversal segment would aim the request somewhere else.
    for (const [name, def] of Object.entries(AI_ACTIONS)) {
      expect(def.path.startsWith('/'), `${name} path must be relative`).toBe(false);
      expect(def.path.includes('..'), `${name} path must not traverse`).toBe(false);
      expect(def.path.startsWith('http'), `${name} path must not be absolute`).toBe(false);
    }
  });

  it('exposes only write methods that were intended', () => {
    for (const [name, def] of Object.entries(AI_ACTIONS)) {
      expect(['POST', 'PATCH'], `${name} uses an unexpected method`).toContain(def.method);
    }
  });
});
