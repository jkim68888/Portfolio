type TagListProps = { items: string[]; label: string; size?: "sm" | "md" };

export function TagList({ items, label, size = "sm" }: TagListProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={`rounded-md bg-zinc-100 font-medium text-zinc-700 ${sizeClass}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}
