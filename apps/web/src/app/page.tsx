import { trpc } from '@/lib/trpc'

export default async function Home() {
  const result = await trpc.health.query()
  return (
    <main>
      <h1>Home Stuff Manager</h1>
      <p>API status: {result.status}</p>
    </main>
  )
}
