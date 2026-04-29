import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from './supabase'

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
        if (!supabaseAdmin) {
          console.error('Supabase admin client not initialized')
          return false
        }

        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', user.email!)
          .maybeSingle()

        if (!existingUser) {
          const { data: newUser, error } = await supabaseAdmin
            .from('users')
            .insert({
              email: user.email,
              name: user.name,
              image: user.image,
            })
            .select('id')
            .single()

          if (error) {
            console.error('Error creating user:', error)
            return false
          }

          return !!newUser
        }

        return true
      } catch (error) {
        console.error('Sign in error:', error)
        return false
      }
    },

    async jwt({ token, user }) {
      if (user?.email && supabaseAdmin) {
        token.email = user.email
        const { data: dbUser } = await supabaseAdmin
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
