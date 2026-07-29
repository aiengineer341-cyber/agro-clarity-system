## Plan: Fix Google login error

### What I found
- The Google button currently tries the backend provider directly first.
- That direct path returns `Unsupported provider: missing OAuth secret` when Google credentials are not configured there.
- The app already has the Lovable-managed OAuth broker installed, which is the correct path for managed Google sign-in.

### Implementation
1. Update the Google sign-in handler to use the Lovable-managed Google OAuth flow first, instead of calling the direct backend provider.
2. Keep the existing `/auth/callback` route as the public return URL so sessions can finish before redirecting users to `/dashboard`.
3. Make the error message user-friendly if Google still fails, without exposing provider internals.
4. Run the Google provider configuration tool so managed Google sign-in is enabled.
5. Verify the auth page still renders and the Google button starts the correct OAuth flow.

### Technical notes
- I will not change database schema or user records.
- I will not edit generated integration files.
- This fix targets the displayed `missing OAuth secret` error by avoiding the direct provider path that causes it.