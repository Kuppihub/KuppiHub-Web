// src/lib/firebase-admin.ts
// Server-side Firebase Admin SDK for secure token verification

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";

let firebaseAdminApp: App;

function getFirebaseAdmin(): App {
  if (getApps().length === 0) {
    // Initialize Firebase Admin with service account
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Validate required environment variables
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      console.error("Missing Firebase Admin environment variables");
      throw new Error("Firebase Admin not configured properly");
    }

    firebaseAdminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    firebaseAdminApp = getApps()[0];
  }

  return firebaseAdminApp;
}

export interface VerifiedUser {
  uid: string;
  email: string | undefined;
  emailVerified: boolean;
  displayName: string | undefined;
  photoURL: string | undefined;
}

/**
 * Verifies a Firebase ID token and returns the decoded user info
 * This should be used in all API routes that require authentication
 */
export async function verifyIdToken(idToken: string): Promise<VerifiedUser | null> {
  try {
    if (!idToken || typeof idToken !== "string") {
      console.error("Invalid ID token provided");
      return null;
    }

    const app = getFirebaseAdmin();
    const auth = getAuth(app);
    
    const decodedToken: DecodedIdToken = await auth.verifyIdToken(idToken);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
    };
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return null;
  }
}

/**
 * Helper function to extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix
}

/**
 * Combined helper: Extract and verify token from request headers
 * Returns the verified user or null if authentication fails
 */
export async function authenticateRequest(
  authorizationHeader: string | null
): Promise<VerifiedUser | null> {
  const token = extractBearerToken(authorizationHeader);
  if (!token) {
    return null;
  }
  return verifyIdToken(token);
}
