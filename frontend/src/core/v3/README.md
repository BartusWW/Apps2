# CBE 3.0 Core

CBE 3.0 is a controlled rebuild of the execution/lifecycle layer, not a rewrite of the whole app.

## Non-negotiable rule

UI does not own lifecycle state. Home blocks, DayLifecycle, AutoClose and logging screens may dispatch commands and render derived state, but there is one canonical answer to: due, progress, complete, dismissed, missed and recovered.

## Canonical model

`Action` = reusable definition.

`Daily Instance` = one dated occurrence of an Action. Every recurring occurrence has a durable dated identity. Completed or dismissed occurrences remain recorded, so a scheduler cannot resurrect them after refresh.

`Execution` = progress applied to an instance. Fixed and quantity instances have a hard target ceiling.

`Habit recovery` = a missed habit becomes terminal `missed`; closing the day creates one idempotent Second Chance instance for the next date.

`Daily / Weekly` = separate scopes. Weekly focus must never be inserted into the daily plan merely to make it visible.

## Migration strategy

1. Freeze v2.6 on its existing branch.
2. Build/test pure v3 core on `feature/cbe-v3-core`.
3. Read legacy daily plans through `legacyAdapter` without mutating existing localStorage.
4. Introduce a v3 persistence store and diagnostic view.
5. Route recurring + habit execution through v3 commands.
6. Route manual and automatic Day Close through the same core command.
7. Reconnect existing UI one block at a time.
8. Only after regression suite passes, retire legacy lifecycle paths.

## Regression gates

A change is not considered safe if it breaks any of these invariants:

- fixed recurring reaches its finite target and becomes completed;
- quantity recurring stops at its target;
- dismissed recurring does not regenerate on refresh;
- completed state survives reload;
- missed habit produces exactly one Second Chance next day;
- completed habit produces no Second Chance;
- resolving Second Chance is terminal;
- manual Day Close and Auto Close use identical lifecycle semantics;
- no duplicate entry or CBE award from re-evaluation;
- weekly scope cannot alter daily lifecycle state.

The first five invariants already have executable tests in `engine.test.js`. Add tests before migrating each additional subsystem.
