// Shadow diagnostics were useful before v3 owned production execution. Once the
// rollout flags are enabled, v2/v3 drift is expected because v3 is the source of
// truth, so rendering the old comparison is misleading. Keep the component as a
// temporary no-op until final migration cleanup removes its Dashboard import.
export default function V3ExecutionDiagnostic() {
  return null;
}
