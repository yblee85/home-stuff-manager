import Link from 'next/link'

export default function LocationNotFound() {
  return (
    <main>
      <h1>Location not found</h1>
      <p>This location does not exist or you don&apos;t have access to it.</p>
      <p>
        <Link href="/locations">← Back to locations</Link>
      </p>
    </main>
  )
}
