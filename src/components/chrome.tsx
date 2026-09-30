import { Link, useRouterState } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { agencyName, type Tone } from "@/lib/labels";
import { getMe } from "@/lib/office";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LoginPanel } from "@/components/login-panel";
import { getBearerToken, isSignedOutOnPurpose } from "@/lib/auth/client";
import { changeOwnPassword } from "@/lib/office";

type Me = Awaited<ReturnType<typeof getMe>>;

const OfficeContext = createContext<{
  me: Me | null;
  agency: string;
  setAgency: (agency: string) => void;
  refreshMe: () => void;
}>({ me: null, agency: "all", setAgency: () => undefined, refreshMe: () => undefined });

export function useOffice() {
  return useContext(OfficeContext);
}

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/viewings", label: "Viewings", icon: CalendarDays },
  { to: "/outstanding", label: "Outstanding", icon: Bell },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [me, setMe] = useState<Me | null>(null);
  const [agency, setAgencyState] = useState("all");
  const [passwordTick, setPasswordTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [sessionSlow, setSessionSlow] = useState(false);
  const signedOut = isSignedOutOnPurpose() && !getBearerToken();
  const path = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    (window as Window & { __feedyReady?: boolean }).__feedyReady = true;
  }, []);

  useEffect(() => {
    if (!isPending) {
      setSessionSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setSessionSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [isPending]);

  useEffect(() => {
    const stored = localStorage.getItem("viewingdesk-agency");
    if (stored) setAgencyState(stored);
  }, []);

  function setAgency(next: string) {
    setAgencyState(next);
    localStorage.setItem("viewingdesk-agency", next);
  }

  function refreshMe() {
    if (!user) return;
    getMe().then(setMe).catch(() => setMe(null));
  }

  useEffect(() => {
    if (!user) return;
    refreshMe();
  }, [user?.id]);

  if (isPending && !sessionSlow) {
    return <div data-feedy-boot className="grid min-h-screen place-items-center bg-paper text-muted">Opening the office book…</div>;
  }
  if (!user || signedOut) return <LoginPanel key={passwordTick} onSignedIn={() => setPasswordTick((value) => value + 1)} />;
  if (me?.mustChangePassword) {
    return <ChangePassword name={me.name} onDone={refreshMe} />;
  }

  return (
    <OfficeContext.Provider value={{ me, agency, setAgency, refreshMe }}>
      <div className="min-h-screen bg-paper text-ink">
        <aside className="desk-only fixed inset-y-0 left-0 z-30 w-60 border-r border-line bg-card px-4 py-6">
          <Brand />
          <AgencySwitch agency={agency} setAgency={setAgency} />
          <nav className="mt-6 grid gap-1">
            {NAV.map((item) => (
              <NavLink key={item.to} {...item} active={path === item.to || (item.to !== "/" && path.startsWith(item.to))} />
            ))}
          </nav>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
            <p className="truncate text-sm text-muted">{me?.name ?? user.displayName}</p>
            <UserButton />
          </div>
        </aside>
        <header className="road-only sticky top-0 z-30 flex items-center justify-between border-b border-line bg-card px-4 py-3">
          <Brand compact />
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu />
          </button>
        </header>
        {open ? (
          <div className="road-only fixed inset-0 z-40 bg-ink/40" onClick={() => setOpen(false)}>
            <div className="ml-auto flex h-full w-72 flex-col bg-card p-4" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="mb-4 grid h-11 w-11 place-items-center" onClick={() => setOpen(false)} aria-label="Close">
                <X />
              </button>
              <AgencySwitch agency={agency} setAgency={setAgency} />
              <nav className="mt-4 grid gap-1">
                {NAV.map((item) => (
                  <NavLink key={item.to} {...item} active={path === item.to} onClick={() => setOpen(false)} />
                ))}
              </nav>
              <div className="mt-auto flex items-center justify-between">
                <p className="text-sm">{me?.name}</p>
                <UserButton />
              </div>
            </div>
          </div>
        ) : null}
        <main className="with-sidebar px-4 py-5 pb-24 md:px-8 md:py-8">{children}</main>
        <nav className="road-only fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card">
          {NAV.slice(0, 4).map((item) => (
            <Link key={item.to} to={item.to} className="grid h-16 place-items-center text-xs text-muted">
              <item.icon className="size-5" />
              {item.label === "Outstanding" ? "Due" : item.label === "Dashboard" ? "Home" : item.label}
            </Link>
          ))}
          <button type="button" className="grid h-16 place-items-center text-xs text-muted" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
            More
          </button>
        </nav>
      </div>
    </OfficeContext.Provider>
  );
}

function ChangePassword({ name, onDone }: { name: string; onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <form
        className="grid w-full max-w-md gap-3 rounded-2xl border border-line bg-card p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (nextPassword !== confirm) {
            setError("The new passwords do not match.");
            return;
          }
          setBusy(true);
          changeOwnPassword({ data: { currentPassword, nextPassword } })
            .then(() => onDone())
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not change the password"))
            .finally(() => setBusy(false));
        }}
      >
        <p className="font-display text-3xl text-pine">Choose your password</p>
        <p className="text-sm text-muted">{name}, this is your first sign-in. Set a password only you know.</p>
        <Field label="Password you were given"><input className={inputClass} type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></Field>
        <Field label="New password"><input className={inputClass} type="password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} required minLength={8} /></Field>
        <Field label="Repeat the new password"><input className={inputClass} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required minLength={8} /></Field>
        {error ? <p className="text-sm text-bad">{error}</p> : null}
        <button className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
      </form>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "" : "px-1"}>
      <img src="/feedy-logo.png?v=2" alt="Feedy" className={compact ? "h-14 w-auto" : "h-28 w-auto max-w-full"} />
      {compact ? null : <p className="mt-2 text-sm text-muted">Lettings feedback</p>}
    </div>
  );
}

function AgencySwitch({ agency, setAgency }: { agency: string; setAgency: (agency: string) => void }) {
  const options = [
    ["all", "Both"],
    ["al", "Andrew Lees"],
    ["gr", "Gibbins Richards"],
  ] as const;
  return (
    <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-neutral-bg p-1 text-center text-xs">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => setAgency(id)}
          className={`rounded-full px-2 py-2 ${agency === id ? "bg-pine text-pine-ink" : "text-muted"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  to: (typeof NAV)[number]["to"];
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex h-11 items-center gap-2 rounded-xl px-3 text-sm ${active ? "bg-pine text-pine-ink" : "text-ink hover:bg-neutral-bg"}`}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

export function PageTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      {action}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl bg-card text-ink shadow-xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full hover:bg-neutral-bg" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "h-11 w-full rounded-xl border border-line bg-card px-3 text-ink outline-none focus:border-pine";
export const buttonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-pine px-4 text-sm text-pine-ink disabled:opacity-50";
export const quietClass = "inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-sm";

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const toneClass =
    tone === "good" ? "bg-good-bg text-good" : tone === "wait" ? "bg-wait-bg text-wait" : tone === "bad" ? "bg-bad-bg text-bad" : "bg-neutral-bg text-muted";
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${toneClass}`}>{children}</span>;
}

export function Progress({ value }: { value: number }) {
  const tone = value >= 80 ? "bg-good" : value >= 50 ? "bg-wait" : "bg-bad";
  return (
    <div className="h-2 overflow-hidden rounded-full bg-neutral-bg">
      <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}

export function agencyOf(id: string) {
  return id === "all" ? "Both agencies" : agencyName(id);
}
