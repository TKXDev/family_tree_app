# Family Tree App

A modern web application for building and exploring your family history.

## Authentication System

The application features a robust authentication system with both session and persistent login options:

### Session-Based Login (Default)

When users sign in without checking "Remember Me":

- Their authentication token is stored as a session cookie
- Session expires when the browser is closed
- User data is stored in sessionStorage
- Provides better security for shared computers

### Persistent Login ("Remember Me")

When users check the "Remember Me" box during sign in:

- Their authentication token persists for 30 days
- Login is maintained across browser sessions
- User data is stored in localStorage
- More convenient for personal devices

### Security Features

- JWT-based authentication
- Secure password hashing with bcrypt
- Automatic redirection for authenticated/unauthenticated users
- Logout confirmation to prevent accidental logouts
- Clear visual indicators of login status in the dashboard

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- User authentication (signup, signin, logout)
- Beautiful, responsive UI
- Dashboard with family tree management
- Profile management
- Secure data storage

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# family_tree_app
