import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/progress(.*)',
  '/api/activity(.*)',
  // Save-factor + cite-list surfaces are cut from v1. The API routes still
  // exist as dead code; leave them protected so a stray direct POST 401s
  // rather than silently letting anonymous traffic in.
  '/api/emission-factors/saved(.*)',
  '/api/emission-factors/cite-lists(.*)',
  // User-scoped surfaces — widened so middleware is the policy gate, not
  // just defense-in-depth inside each handler.
  '/api/resume(.*)',
  '/api/ask(.*)',
]);

// Internal routes that authenticate with a shared bearer token, not Clerk.
// Must be exempted from auth.protect() so the bearer flow can run.
const isInternalBearerRoute = createRouteMatcher([
  '/api/resume/process(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isInternalBearerRoute(req)) return;
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Sentry's tunnel route so error reports bypass Clerk auth.
    '/((?!_next|monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
