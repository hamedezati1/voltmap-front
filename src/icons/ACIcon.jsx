export default function ACIcon({
  size = 24,
  color = "currentColor"
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
    >
      <rect
        x="14"
        y="8"
        width="36"
        height="48"
        rx="8"
        stroke={color}
        strokeWidth="2.2"
      />

      <path
        d="M22 32
           C26 20,
           38 44,
           42 32"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  )
}