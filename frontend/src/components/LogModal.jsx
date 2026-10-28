import { useApp } from "../context/AppContext";
import QuantityLogModal from "./QuantityLogModal";

export default function LogModal() {
  const { logModal, closeLogModal, actions } = useApp();

  if (!logModal.open) return null;

  let action = logModal.actionId
    ? (actions || []).find((a) => a.id === logModal.actionId) || null
    : null;

  if (!action && logModal.categoryName) {
    action = (actions || []).find((a) => a.category === logModal.categoryName) || null;
  }

  if (!action) {
    closeLogModal();
    return null;
  }

  return (
    <QuantityLogModal
      action={action}
      onClose={closeLogModal}
      source="log-actions"
    />
  );
}
