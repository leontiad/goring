# Supabase OAuth Configuration

To make Google OAuth work properly, you need to configure the redirect URLs in your Supabase project.

## Steps to Configure:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/vnlqjqozuggbgvoyewwq

2. **Navigate to Authentication Settings**
   - Go to Authentication → Settings → URL Configuration

3. **Add Redirect URLs**
   Add these URLs to the "Redirect URLs" section:
   ```
   http://localhost:5173/auth/callback
   http://localhost:5174/auth/callback
   https://your-production-domain.com/auth/callback
   ```

4. **Configure Google OAuth Provider**
   - Go to Authentication → Providers → Google
   - Enable Google provider
   - Add your Google OAuth credentials (Client ID and Client Secret)
   - Make sure the redirect URL in Google Console matches: `https://vnlqjqozuggbgvoyewwq.supabase.co/auth/v1/callback`

5. **Site URL Configuration**
   - Set Site URL to: `http://localhost:5173` (for development)
   - For production, set it to your actual domain

## Testing the Flow:

1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:5173`
3. Click "Try It Now" button
4. A login modal will appear with "Continue with Google" button
5. Click the Google button to start OAuth flow
6. You should be redirected to Google for authentication
7. After Google auth, you should be redirected back to `/auth/callback`
8. Then automatically redirected back to the main page
9. If authenticated, clicking "Try It Now" will take you to `/dashboard`

## User Experience:

- **Login Modal**: Instead of a separate login page, users see a clean modal overlay
- **Seamless Flow**: Users stay on the main page throughout the authentication process
- **Error Handling**: Any authentication errors are displayed in the modal
- **Responsive Design**: The modal works on all device sizes

## Troubleshooting:

If you're still having issues:
1. Check the browser console for errors
2. Check the server logs for authentication errors
3. Verify that the redirect URLs are correctly configured in Supabase
4. Make sure Google OAuth is properly configured in Supabase
5. Ensure the Site URL is set correctly in Supabase settings 