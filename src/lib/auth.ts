import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabase } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user }) {
      // Save or update user in Supabase on first login
      if (user.email) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single()

        if (!existingUser) {
          // Create new user
          await supabase.from('users').insert({
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image,
            created_at: new Date().toISOString(),
          })
        }
      }
      return true
    },
    async jwt({ token, account, user }) {
      if (user?.email) {
        // Get user ID from Supabase
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single()

        token.userId = data?.id
        token.email = user.email
      }

      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
      }
      session.accessToken = token.accessToken as string
      return session
    },
  },
}
