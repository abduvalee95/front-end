type RawMessage = {
  role: string;
  content?: unknown;
  parts?: Array<{ type: string; text?: string }>;
};

export type NormalizedMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Roles a CLIENT is allowed to claim.
 *
 * 'system' is deliberately absent. The message array arrives from the browser,
 * so accepting a system role let a caller prepend their own system message and
 * argue with the real instructions that this route passes separately via
 * `system:`. Anything unrecognised — including 'system' and 'tool' — is
 * demoted to 'user', where it reads as something the user said rather than as
 * an instruction the assistant should obey.
 */
const CLIENT_ROLES = ['user', 'assistant'] as const;

export function normalizeMessages(messages: RawMessage[]): NormalizedMessage[] {
  return messages.map((m) => {
    let content = '';
    if (typeof m.content === 'string') {
      content = m.content;
    } else if (Array.isArray(m.parts)) {
      content = m.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text ?? '')
        .join('');
    }
    const role = CLIENT_ROLES.includes(m.role as NormalizedMessage['role'])
      ? (m.role as NormalizedMessage['role'])
      : 'user';
    return { role, content: content || ' ' };
  });
}
