/**
 * Local username/password sign-in. Public sign-up is off: an admin creates
 * each staff login and sets the first password.
 */
export const emailAndPassword = {
  enabled: true,
  disableSignUp: true,
  minPasswordLength: 8,
  autoSignIn: true,
} as const;
