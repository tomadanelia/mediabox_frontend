export function Equalizer() {
  const bars = [
    { delay: 1.0, duration: 1.56, scale: 0.8 },
    { delay: 0.6, duration: 1.24, scale: 0.4 },
    { delay: 0.3, duration: 1.52, scale: 1.0 },
    { delay: 0.7, duration: 1.36, scale: 0.6 },
    { delay: 0.45, duration: 1.18, scale: 0.25 },
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: 40,
      height: 40,
      padding: 6,
      gap: 2,
    }}>
      {bars.map(({ delay, duration, scale }, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "60%",
            borderRadius: 3,
            backgroundColor: "#fb923c",
            transform: `scaleY(${scale})`,
            animation: `eq-wave ${duration}s ease-in-out ${-delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes eq-wave {
          0%   { transform: scaleY(0.1); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}