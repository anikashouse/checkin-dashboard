import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account }) {
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

        let userId: string | null = existingUser?.id ?? null

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

          userId = newUser?.id ?? null
        }

        if (userId && account?.refresh_token) {
          await supabaseAdmin.from('user_services').upsert({
            user_id: userId,
            google_refresh_token: account.refresh_token,
          }, { onConflict: 'user_id', ignoreDuplicates: false })
        }

        return !!userId
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
