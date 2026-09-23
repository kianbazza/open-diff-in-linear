import type { Message, MessageResponses } from "./messages";
import {
  consumeSkip,
  markSkip,
  recordHandoff,
  wasRecentlyHandedOff,
} from "./session-records";

/** Answer one message from a content script. `senderTabId` is `sender.tab?.id`. */
export async function handleMessage(
  message: Message,
  senderTabId: number | undefined,
): Promise<MessageResponses[Message["type"]]> {
  switch (message.type) {
    case "mark-skip":
      if (senderTabId !== undefined) await markSkip(senderTabId, message.prKey);
      return undefined;
    case "consume-skip":
      return senderTabId === undefined
        ? false
        : consumeSkip(senderTabId, message.prKey);
    case "record-handoff":
      await recordHandoff(message.prKey);
      return undefined;
    case "was-recently-handed-off":
      return wasRecentlyHandedOff(message.prKey);
  }
}
