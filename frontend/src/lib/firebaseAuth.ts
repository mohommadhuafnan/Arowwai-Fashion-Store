import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from './firebase';

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  return user;
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

export const signInWithGoogle = async (): Promise<User> => {
  const { user } = await signInWithPopup(auth, googleProvider);
  return user;
};

export const signInWithGithub = async (): Promise<User> => {
  const { user } = await signInWithPopup(auth, githubProvider);
  return user;
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const firebaseSignOut = async () => {
  await signOut(auth);
};

export const getFirebaseIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
};

export function mapFirebaseAuthError(code?: string): string {
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This website domain is not allowed in Firebase. Add arowwai-fashion-store.vercel.app in Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked. Allow pop-ups for this site and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email using a different sign-in method.';
    default:
      return code?.replace('auth/', '').replace(/-/g, ' ') || 'Authentication failed';
  }
}

export const parseDisplayName = (user: User) => {
  const name = user.displayName || user.email?.split('@')[0] || 'User';
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || 'User',
    lastName: parts.slice(1).join(' ') || '',
    avatar: user.photoURL || undefined,
    email: user.email || '',
    provider: user.providerData[0]?.providerId?.includes('google')
      ? 'google'
      : user.providerData[0]?.providerId?.includes('github')
      ? 'github'
      : 'email',
  };
};
