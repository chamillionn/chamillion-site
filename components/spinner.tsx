/**
 * Inline loading spinner — a rotating arc that inherits currentColor.
 * Uses the global `spin` keyframe from globals.css.
 */
export default function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
