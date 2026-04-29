import { withAuth } from 'next-auth/middleware'

export const middleware = withAuth(
  function middleware(req) {
    // Protected routes logic can go here if needed
    return null
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/:path*',
    '/api/sync/:path*',
  ],
}
