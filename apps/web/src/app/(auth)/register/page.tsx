import Link from 'next/link'
import { RegisterForm } from './RegisterForm'

export default function RegisterPage() {
  return (
    <main>
      <h1>Create account</h1>
      <RegisterForm />
      <Link href="/login">Already have an account?</Link>
    </main>
  )
}
