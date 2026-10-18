import { STATUS_LABELS } from "../utils";

export default function StatusBadge({ status }) {
  const value = status || "ACTIVE";
  return <span className={`badge badge-${value.toLowerCase()}`}>{STATUS_LABELS[value] || value}</span>;
}
