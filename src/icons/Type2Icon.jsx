export default function Type2Icon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="28" stroke={color} strokeWidth="2.5" />

      <circle cx="20" cy="20" r="4" stroke={color} strokeWidth="2.5" />
      <circle cx="44" cy="20" r="4" stroke={color} strokeWidth="2.5" />

      <circle cx="16" cy="34" r="4" stroke={color} strokeWidth="2.5" />
      <circle cx="32" cy="34" r="4" stroke={color} strokeWidth="2.5" />
      <circle cx="48" cy="34" r="4" stroke={color} strokeWidth="2.5" />

      <circle cx="24" cy="48" r="4" stroke={color} strokeWidth="2.5" />
      <circle cx="40" cy="48" r="4" stroke={color} strokeWidth="2.5" />
    </svg>
  );
}
