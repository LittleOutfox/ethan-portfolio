interface IconProps {
  name: 'external'
  size?: number
}

/** The page's icon set: one stroke weight, drawn, never a glyph. */
export function Icon({ name, size = 16 }: IconProps) {
  if (name === 'external') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
        <path d="M6.5 3.5H3.5v9h9V9.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
        <path d="M9 3.5h3.5V7M12.5 3.5 7.5 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
      </svg>
    )
  }
  return null
}
