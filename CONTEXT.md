# Open Diff in Linear

A Chrome extension that recognises GitHub and Graphite pull request pages and hands them to Linear's review view. This glossary is the vocabulary for code, specs, issues, and PRs.

## Language

### Pages and targets

**PR page**:
A GitHub or Graphite page that shows one pull request. The only kind of page the extension acts on.
_Avoid_: diff page, review page

**View**:
The part of a PR page currently shown. Three values: overview (GitHub Conversation, Graphite's PR page), changes (GitHub Files changed / Changes), and other (Commits, Checks, anything else).
_Avoid_: tab (reserved for the injected tab), sub-page

**Open target**:
Which Linear client a PR opens in. Three values: **Desktop app** (`linear://`), **Web app** (`linear.app` forced to stay in the browser), and **Linear decides** (`linear.app` with Linear's own preference applied).
_Avoid_: destination, client, mode

**Handoff**:
The act of sending the current PR page to Linear, whether by a pill click or by automatic mode.
_Avoid_: redirect (only correct for automatic mode), open, jump

### Modes

**Manual mode**:
The default mode. PR pages show the pill; nothing happens until the user clicks it.

**Automatic mode**:
The opt-in mode. On PR pages from an allowlisted org, an overview or changes view starts a countdown toast and then hands off unless cancelled. The pill is still shown.
_Avoid_: auto-redirect mode, auto mode

**Allowlist**:
The list of GitHub org names automatic mode applies to. Empty means automatic mode applies nowhere.
_Avoid_: whitelist, org list, scope

### Triggers

**Pill**:
The manual trigger, shown on every PR page in both modes. Comes in two forms: the **tab** and the **floating pill**.
_Avoid_: button, badge, chip

**Tab**:
The pill form injected into GitHub's PR tab bar next to Conversation / Commits / Checks / Files changed, labelled "View in Linear". GitHub only.
_Avoid_: header button, nav item

**Floating pill**:
The pill form fixed to the bottom-left corner of the page. Always visible on PR pages, on GitHub and Graphite alike.
_Avoid_: FAB, widget, bubble

**Flip modifier**:
The ⌥ Option / Alt key. Held while clicking the pill it opens the other open target; held during a countdown it cancels; held while clicking a PR link it makes the arrival skip the countdown. Does nothing to the pill when the open target is Linear decides.
_Avoid_: alt-click, modifier key, secondary action

### Automatic-mode behaviour

**Countdown toast**:
The bottom-left toast shown by automatic mode before a handoff ("Opening in Linear… ⌥ to stay", with a progress bar). Becomes the floating pill when it fires or is cancelled.
_Avoid_: interstitial, banner, notification

**Countdown**:
The delay before an automatic handoff. A setting: 0.5, 1, 1.5, or 3 seconds; default 1.5.
_Avoid_: delay, timer, grace period

**Sticky cancellation**:
Once a countdown is cancelled for a PR in a tab, no further countdown starts for that PR in that tab, however many views the user switches between.
_Avoid_: snooze, pause, cooldown

**Loop breaker**:
The rule that a PR handed off within the last ~60 seconds, in any tab, arrives with no countdown and a "Back from Linear, staying on GitHub" toast.
_Avoid_: bounce protection, cooldown, referrer check

**Tab cleanup**:
After an automatic handoff to the desktop app is confirmed (the page loses focus), closing a tab that was opened fresh for the PR or going back in a tab that has history. Never happens after a pill click.
_Avoid_: auto-close, tab close
