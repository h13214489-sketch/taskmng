import { cn } from "@/lib/utils";

interface TagChipProps {
  label: string;
  color: string;
  selected?: boolean;
  onClick?: () => void;
}

export function TagChip({ label, color, selected = false, onClick }: TagChipProps) {
  const className = cn(
    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
    selected
      ? "border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-900/20"
      : "border-rose-100 bg-white text-slate-700 hover:border-rose-200 hover:shadow-sm",
  );

  if (!onClick) {
    return (
      <div className={className}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </button>
  );
}
