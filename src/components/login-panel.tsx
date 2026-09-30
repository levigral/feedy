import { authClient, clearSignedOut } from "@/lib/auth/client";
import { prepareSignIn, resolveLogin } from "@/lib/office";
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
      const { email } = await resolveLogin({ data: { username } });
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
      });
      if (result.error) {
        const message = result.error.message ?? "";
        setError(/invalid email or password/i.test(message) ? "That username or password is not right." : message || "That username or password is not right.");
        return;
      }
      clearSignedOut();
      const session = await authClient.getSession();
      if (!session.data?.user) {
        setError("That username or password is not right.");
        return;
      }
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
        <p className="mt-1 text-sm text-muted">Sign in with your username and password. Email addresses work too.</p>
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