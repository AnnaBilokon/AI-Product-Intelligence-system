import clsx from "clsx";

export function StatusIndicator({
  status,
  label,
}: {
  status: "healthy" | "warning" | "offline";
  label: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        status === "healthy" && "bg-moss/10 text-moss",
        status === "warning" && "bg-amber-100 text-amber-700",
        status === "offline" && "bg-rose-100 text-rose-700",
      )}
    >
      <span
        className={clsx(
          "h-2 w-2 rounded-full",
          status === "healthy" && "bg-moss",
          status === "warning" && "bg-amber-500",
          status === "offline" && "bg-rose-500",
        )}
      />
      {label}
    </span>
  );
}
