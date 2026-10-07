export default function GBTACIcon({
  size = 24,
  color = "currentColor"
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke={color}
        strokeWidth="2.5"
      />

      <circle cx="24" cy="24" r="3" fill={color} />
      <circle cx="40" cy="24" r="3" fill={color} />
      <circle cx="24" cy="40" r="3" fill={color} />
      <circle cx="40" cy="40" r="3" fill={color} />
      <circle cx="32" cy="32" r="3" fill={color} />
    </svg>
  )
}