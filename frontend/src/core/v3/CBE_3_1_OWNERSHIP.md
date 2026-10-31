# CBE 3.1 — Single-owner execution architecture

## Non-negotiable ownership rules

1. **Core instances are the only source of truth for execution.**
   Progress, completion, dismissal, delay, missed state, carryover, Second Chance and day-close decisions live only in `core/v3` state.
2. **`dailyPlans` are planning input only.**
   They may create an occurrence or change an ACTIVE planned target. They never write execution progress/status back into Core.
3. **`entries` are append-only history/scoring output.**
   An Entry is produced only after Core accepts an execution transition. Entries never reconstruct or overwrite Core progress.
4. **UI has no lifecycle rules.**
   Cards render selectors and dispatch commands. Close Day renders unresolved Core instances and submits resolutions.
5. **No shadow reconciliation in 3.1.**
   There is no `Entries -> Core`, `legacy status -> Core`, or priority/fallback chain between competing execution stores.

## Data flow

```text
Action definitions + planning
          |
          v
      CBE Core 3.1
          |
   accepted command
      /        \
     v          v
selectors    scoring effect
     |          |
     v          v
UI views     Entries/history
```

## Execution commands

- `LOG(instanceId, amount)` — advances progress by the accepted amount, capped at target.
- `COMPLETE(instanceId)` — completes the remaining amount.
- `DELAY(instanceId)` — records delay metadata in Core.
- `DISMISS(instanceId, reason)` — terminal decision in Core.
- `CLOSE_DAY(date, resolutions)` — one lifecycle implementation for manual/automatic close.

## Habit recovery

Normal missed habit:

`debt = target - progress`

`Second Chance target = base target + debt`

A missed Second Chance resolves terminally and does not create a third chance.

## Stack resolution

For a stack with `remaining > 1`, Close Day accepts an explicit split:

```js
{ tomorrow: 2, drop: 1, wontDo: 0 }
```

The sum must equal the remaining stack count. Only `tomorrow` becomes a new Core carryover instance.

## Migration rule

Legacy components may remain in the repository as reference during the 3.1 branch, but Home execution must not call their execution handlers. Once 3.1 passes regression testing, obsolete shadow/reconciliation code should be deleted rather than retained as fallback behavior.
