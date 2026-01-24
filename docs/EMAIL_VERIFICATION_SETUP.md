# Email Verification Environment Configuration

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Resend API Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=MentorMatch <onboarding@resend.dev>

# App URL for verification links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Instructions

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Copy the key and add it to `.env.local` as `RESEND_API_KEY`

### 2. Configure Email Sender

**For Testing (No Domain Required):**
```bash
RESEND_FROM_EMAIL=MentorMatch <onboarding@resend.dev>
```

**For Production (Requires Verified Domain):**
1. Add and verify your domain in Resend dashboard
2. Update the email:
```bash
RESEND_FROM_EMAIL=MentorMatch <noreply@yourdomain.com>
```

### 3. Set Application URL

**Development:**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production:**
```bash
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

## Verification

After adding the environment variables, restart your development server:

```bash
npm run dev
```

The email verification system will now be active for new student registrations.

## Testing

1. Register a new student account
2. Check the terminal logs for the verification email (or check your Resend dashboard)
3. Click the verification link in the email
4. Try logging in - you should be able to access the platform

## Troubleshooting

- **Email not sending**: Check that `RESEND_API_KEY` is set correctly
- **Verification link broken**: Ensure `NEXT_PUBLIC_APP_URL` matches your running application URL
- **"Email service not configured" error**: Restart your server after adding environment variables
