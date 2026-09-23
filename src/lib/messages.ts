import { browser } from "#imports";

export type Message =
  | { type: "mark-skip"; prKey: string }
  | { type: "consume-skip"; prKey: string }
  | { type: "record-handoff"; prKey: string }
  | { type: "was-recently-handed-off"; prKey: string };

export interface MessageResponses {
  "mark-skip": undefined;
  "consume-skip": boolean;
  "record-handoff": undefined;
  "was-recently-handed-off": boolean;
}

export function isMessage(value: unknown): value is Message {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { type?: unknown; prKey?: unknown };
  return (
    typeof candidate.prKey === "string" &&
    (candidate.type === "mark-skip" ||
      candidate.type === "consume-skip" ||
      candidate.type === "record-handoff" ||
      candidate.type === "was-recently-handed-off")
  );
}

/** Send to the background. Resolves to `fallback` when the background is unreachable (for example while the extension reloads). */
export async function sendMessage<M extends Message>(
  message: M,
  fallback: MessageResponses[M["type"]],
): Promise<MessageResponses[M["type"]]> {
  try {
    return (await browser.runtime.sendMessage(
      message,
    )) as MessageResponses[M["type"]];
  } catch {
    return fallback;
  }
}
