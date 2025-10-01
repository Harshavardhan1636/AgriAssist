# Firebase Setup Guide

This guide explains how to set up Firebase for the AgriAssist application.

## Prerequisites

1. A Google account
2. A Firebase project (created at https://console.firebase.google.com/)

## Setting Up Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. In the project settings, scroll down to the "Your apps" section
4. Click on the Web icon (</> ) to create a new web app
5. Register your app with a name (e.g., "AgriAssist")
6. Firebase will provide you with configuration values that look like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnopqrstuvwxyz"
};
```

## Environment Variables

Copy the configuration values to your `.env.local` file in the project root:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnopqrstuvwxyz
```

## Enabling Authentication

1. In the Firebase Console, go to the "Authentication" section
2. Click on the "Get started" button
3. Enable the "Email/Password" sign-in provider
4. Optionally, enable other sign-in providers as needed

## Enabling Firestore

1. In the Firebase Console, go to the "Firestore Database" section
2. Click on the "Create database" button
3. Start in "test mode" for development (remember to secure before production)
4. Choose a location for your database

## Demo Mode

The application includes a demo mode that works without Firebase configuration:

- Email: `demo@agriassist.com`
- Password: `demo123`

This allows you to test the application without setting up Firebase.

## Troubleshooting

If you encounter the "Firebase: Error (auth/invalid-api-key)" error:

1. Check that all environment variables are correctly set in `.env.local`
2. Verify that the API key is correct in the Firebase Console
3. Ensure there are no extra spaces or characters in the values
4. Restart the development server after making changes to environment variables

## Security Note

Never commit your `.env.local` file to version control. It's already included in `.gitignore` to prevent accidental commits.