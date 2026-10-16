export type TagTone = "neutral" | "accent";

const TONE_CLASSES: Record<TagTone, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  accent: "bg-gray-100 text-gray-800",
};

type TagListProps = { items: string[]; label: string; size?: "sm" | "md"; tone?: TagTone };

export function TagList({ items, label, size = "sm", tone = "neutral" }: TagListProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={`rounded-md font-medium ${TONE_CLASSES[tone]} ${sizeClass}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}
