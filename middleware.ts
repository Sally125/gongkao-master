import { auth } from '@/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname === '/login'
  const isOnRegisterPage = req.nextUrl.pathname === '/register'
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard')

  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  if (isLoggedIn && (isOnLoginPage || isOnRegisterPage)) {
    return Response.redirect(new URL('/dashboard', req.nextUrl))
  }
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}