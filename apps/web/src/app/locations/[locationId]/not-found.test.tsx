import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LocationNotFound from './not-found'

vi.mock('next/link', () => ({
  default ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  },
}))

describe('LocationNotFound', () => {
  it('renders messaging and back link', () => {
    render(<LocationNotFound />)
    expect(screen.getByRole('heading', { name: /location not found/i })).toBeInTheDocument()
    expect(screen.getByText(/does not exist or you don't have access/i)).toBeInTheDocument()
    const back = screen.getByRole('link', { name: /back to locations/i })
    expect(back).toHaveAttribute('href', '/locations')
  })
})
