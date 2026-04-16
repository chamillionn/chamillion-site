export default function HubLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "40vh",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          border: "2px solid var(--border)",
          borderTopColor: "var(--steel-blue)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}
