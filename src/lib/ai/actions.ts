import { z } from 'zod';

/**
 * The allowlist of writes the AI copilot is permitted to propose.
 *
 * The model does not get to name an endpoint. It names an ACTION, and the
 * mapping from action to HTTP path/method lives here — on the server, out of
 * reach of anything the model emits or a client hand-edits. Previously the tool
 * output carried `confirmUrl` and `confirmMethod` and the browser called
 * whatever it was handed; the only guard was an array compared in client code,
 * which is advice rather than enforcement, and it checked the URL while leaving
 * the request body entirely unvalidated.
 *
 * Every action re-validates its payload here at execution time. The proposal
 * that the user saw and the request that is actually sent are checked against
 * the same schema, so a payload cannot be widened in between.
 */

const PaymentMethod = z.enum(['CASH', 'CARD', 'TRANSFER']);

/**
 * Ceiling for any single AI-proposed amount.
 *
 * Not a business rule — the backend owns those. This is a blast-radius limit:
 * the model picks these numbers from free-form text, so a misparse ("2,000,000"
 * read as 2000000000) should fail here rather than land in the ledger. The
 * backend remains the authority and may reject far lower.
 */
const MAX_AMOUNT = 1_000_000_000;

const Amount = z.number().finite().positive().max(MAX_AMOUNT);

/** A backend id. Rejects the empty string, which some backends read as "any". */
const Id = z.string().trim().min(1).max(64);

export const AI_ACTIONS = {
  enroll_student: {
    path: 'enrollment',
    method: 'POST',
    schema: z.object({
      student_id: Id,
      group_id: Id,
      monthly_fee: Amount.optional(),
    }),
  },
  record_payment: {
    path: 'payment',
    method: 'POST',
    schema: z.object({
      student_id: Id,
      amount: Amount,
      method: PaymentMethod,
      description: z.string().max(200).optional(),
    }),
  },
} as const;

export type AiActionName = keyof typeof AI_ACTIONS;

/**
 * `Object.hasOwn` rather than `in` or a bare property read: an action name
 * arrives as untrusted JSON, and `'constructor'` or `'toString'` would
 * otherwise resolve through the prototype chain to something truthy.
 */
export function isAiActionName(value: unknown): value is AiActionName {
  return typeof value === 'string' && Object.hasOwn(AI_ACTIONS, value);
}

/** Shape the copilot tools return and the confirm endpoint accepts. */
export interface AiProposal {
  kind: 'proposal';
  action: AiActionName;
  /** Human-readable line the user actually confirms. */
  summary: string;
  payload: Record<string, unknown>;
}
