import Link from 'next/link'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <main>
      <h1>Login</h1>
      <LoginForm />
      <Link href="/register">Create account</Link>
    </main>
  )
}
