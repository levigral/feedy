import { authClient, clearSignedOut } from "@/lib/auth/client";
import { staffLoginEmail } from "@/lib/staff-login";
import { prepareSignIn } from "@/lib/office";
import { useEffect, useState, type FormEvent } from "react";

export function LoginPanel({ onSignedIn }: { onSignedIn?: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    prepareSignIn().catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.email({
        email: staffLoginEmail(username),
        password,
        callbackURL: "/",
      });
      if (result.error) {
        setError(result.error.message ?? "That username or password is not right.");
        return;
      }
      clearSignedOut();
      await authClient.getSession();
      onSignedIn?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-sm">
        <img src="/feedy-logo.png?v=2" alt="Feedy" className="h-40 w-auto" />
        <p className="mt-1 text-sm text-muted">Sign in with the username and password you were given.</p>
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <input className="h-11 rounded-xl border border-line px-3" placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          <input className="h-11 rounded-xl border border-line px-3" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          <button type="submit" disabled={pending} className="h-11 rounded-xl bg-pine text-pine-ink">
            {pending ? "Please wait…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
