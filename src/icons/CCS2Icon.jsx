export default function CCS2Icon({
  size = 24,
  color = "currentColor",
  strokeWidth = 2.2,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 80"
      fill="none"
    >
      <circle
        cx="32"
        cy="28"
        r="22"
        stroke={color}
        strokeWidth={strokeWidth}
      />

      <circle cx="22" cy="18" r="3" fill={color} />
      <circle cx="42" cy="18" r="3" fill={color} />

      <circle cx="18" cy="32" r="3" fill={color} />
      <circle cx="32" cy="32" r="3" fill={color} />
      <circle cx="46" cy="32" r="3" fill={color} />

      <circle cx="25" cy="45" r="3" fill={color} />
      <circle cx="39" cy="45" r="3" fill={color} />

      <circle
        cx="22"
        cy="68"
        r="7"
        stroke={color}
        strokeWidth={strokeWidth}
      />

      <circle
        cx="42"
        cy="68"
        r="7"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}