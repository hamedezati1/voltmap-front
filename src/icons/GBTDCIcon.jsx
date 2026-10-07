export default function GBTDCIcon({
  size = 24,
  color = "currentColor"
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 80" fill="none">
      <circle
        cx="32"
        cy="26"
        r="20"
        stroke={color}
        strokeWidth="2.5"
      />

      <circle cx="24" cy="20" r="3" fill={color} />
      <circle cx="40" cy="20" r="3" fill={color} />
      <circle cx="24" cy="32" r="3" fill={color} />
      <circle cx="40" cy="32" r="3" fill={color} />
      <circle cx="32" cy="26" r="3" fill={color} />

      <circle
        cx="22"
        cy="64"
        r="7"
        stroke={color}
        strokeWidth="2.5"
      />

      <circle
        cx="42"
        cy="64"
        r="7"
        stroke={color}
        strokeWidth="2.5"
      />
    </svg>
  )
}