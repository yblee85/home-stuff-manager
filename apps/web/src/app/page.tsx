import { redirect } from 'next/navigation'
import { getSessionUser, logout } from '@/lib/auth'
import { api } from '@/lib/api'

export default async function Home() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const result = await api.health()

  return (
    <main>
      <h1>Home Stuff Manager</h1>
      <p>Welcome, {user.name ?? user.email}</p>
      <p>API status: {result.status}</p>
      <form
        action={async () => {
          'use server'
          await logout()
          redirect('/login')
        }}
      >
        <button type="submit">Logout</button>
      </form>
    </main>
  )
}
