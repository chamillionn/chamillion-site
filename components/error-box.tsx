/**
 * Styled error message with icon and container.
 * Uses the global .error-box class from globals.css.
 */
export default function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="error-box" role="alert">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{children}</span>
    </div>
  );
}
