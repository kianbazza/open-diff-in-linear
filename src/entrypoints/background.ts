import { browser, defineBackground } from "#imports";
import { handleMessage } from "@/lib/background-handlers";
import { isMessage } from "@/lib/messages";

export default defineBackground({
  main() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!isMessage(message)) return false;
      handleMessage(message, sender.tab?.id).then(sendResponse, () =>
        sendResponse(undefined),
      );
      return true;
    });
  },
});
