import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from 'api'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.API_URL}/trpc`,
    }),
  ],
})
