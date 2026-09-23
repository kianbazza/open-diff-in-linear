import { linearUrl, type OpenTarget } from "@/lib/linear-url";
import { sendMessage } from "@/lib/messages";
import { type HandoffKind, openLinearUrl } from "@/lib/navigate";
import { type PrPage, prKey } from "@/lib/pr-page";

/**
 * Record the handoff with the background (for the loop breaker), then navigate to the Linear URL.
 * A click navigates immediately, so the browser still treats `window.open` as user-initiated;
 * the page stays, so the record still lands. An automatic handoff waits for the record,
 * because `location.assign` unloads the page.
 */
export async function handoff(
  page: PrPage,
  target: OpenTarget,
  kind: HandoffKind,
): Promise<void> {
  const recorded = sendMessage(
    { type: "record-handoff", prKey: prKey(page) },
    undefined,
  );
  if (kind === "automatic") await recorded;
  openLinearUrl(linearUrl(page, target), kind);
}
