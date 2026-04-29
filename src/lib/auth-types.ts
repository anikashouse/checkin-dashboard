import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: DefaultSession['user'] & {
      id: string
    }
    accessToken?: string
  }

  interface JWT {
    userId?: string
    email?: string
    accessToken?: string
  }
}
