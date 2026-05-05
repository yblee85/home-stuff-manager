'use server'

import { redirect } from 'next/navigation'
import { loginWithCredentials } from '@/lib/auth'

export async function loginAction(formData: FormData) {
  await loginWithCredentials(formData.get('email') as string, formData.get('password') as string)
  redirect('/')
}
