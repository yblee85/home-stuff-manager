'use server'

import { redirect } from 'next/navigation'
import { api } from '@/lib/api'

export async function registerAction(formData: FormData) {
  await api.auth.register({
    email: formData.get('email') as string,
    name: formData.get('name') as string,
    password: formData.get('password') as string,
  })
  redirect('/login')
}
