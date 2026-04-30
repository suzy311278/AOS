interface Props {
  items: string;
}

export default function KeyTakeaways({ items }: Props) {
  const parsed = items.split(';;').map(s => s.trim()).filter(Boolean);

  return (
    <div
      className="border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 rounded-xl mt-12 mb-6 shadow-sm relative overflow-hidden"
      role="note"
      aria-label="Key takeaways"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-xl" />
      <p className="font-bold text-emerald-900 text-lg mb-4 flex items-center gap-2">
        Key Takeaways
      </p>
      <ul className="space-y-3">
        {parsed.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-gray-700">
            <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
