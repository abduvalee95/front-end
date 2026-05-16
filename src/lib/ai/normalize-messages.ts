type RawMessage = {
  role: string;
  content?: unknown;
  parts?: Array<{ type: string; text?: string }>;
};

export type NormalizedMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

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
    const VALID_ROLES = ['user', 'assistant', 'system'] as const;
    const role = VALID_ROLES.includes(m.role as NormalizedMessage['role'])
      ? (m.role as NormalizedMessage['role'])
      : 'user';
    return { role, content: content || ' ' };
  });
}
