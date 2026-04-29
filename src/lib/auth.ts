import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabase } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user }) {
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email!)
          .maybeSingle()

        if (!existingUser) {
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              email: user.email,
              name: user.name,
              image: user.image,
            })
            .select('id')
            .single()

          return !!newUser
        }

        return true
      } catch (error) {
        console.error('Sign in error:', error)
        return true
      }
    },

    async jwt({ token, user, account }) {
      if (user?.email) {
        token.email = user.email
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .maybeSingle()

        if (dbUser?.id) {
          token.sub = dbUser.id
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.email = token.email as string
      }
      return session
    },
  },
}
