export default function DCIcon({
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
        d="M34 16L24 32H34L28 48"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}