import type { AnchorHTMLAttributes, ReactNode } from 'react'

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
}

/** A link that opens in a new tab and says so to assistive technology. */
export function ExternalLink({ children, ...rest }: Props) {
  return (
    <a {...rest} target="_blank" rel="noopener">
      {children}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  )
}
