import AutoCloseDay from "./AutoCloseDay";
import { useOptionalV3Execution } from "../context/V3ExecutionContext";

// Exactly one lifecycle owner may auto-close a day. Once v3 dayClose is enabled,
// the legacy AutoCloseDay component is not mounted at all.
export default function LegacyAutoCloseGate() {
  const v3 = useOptionalV3Execution();
  if (v3?.isEnabled("dayClose")) return null;
  return <AutoCloseDay />;
}
