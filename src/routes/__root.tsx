import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Shell } from "@/components/chrome";
import appCss from "../styles.css?url";

function publicAppHost(hostHeader: string | undefined): string {
  const host = String(hostHeader ?? "").split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
  if (!host || !/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) return "";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return "";
  if (host === "vercel.app" || host.endsWith(".vercel.app") || host === "vercel.com" || host.endsWith(".vercel.com")) return "";
  return host;
}

function resolvePublicHost(hostHeader: string): string {
  return publicAppHost(import.meta.env.VITE_PUBLIC_HOSTNAME) || publicAppHost(hostHeader);
}

export const Route = createRootRoute({
  beforeLoad: async () => {
    let header = "";
    if (import.meta.env.SSR) {
      try {
        const { getRequestHeader } = await import("@tanstack/react-start/server");
        header = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host") ?? "";
      } catch {
        header = "";
      }
    } else if (typeof window !== "undefined") {
      header = window.location.host;
    }
    return { publicHost: resolvePublicHost(header) };
  },
  head: ({ match }) => {
    const host = match.context.publicHost;
    const xBanner = host ? `https://${host}/x-banner.jpg` : "";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "Feedy" },
        { name: "theme-color", content: "#007da5" },
        ...(xBanner ? [{ property: "x:game:image", content: xBanner }] : []),
      ],
      links: [
        { rel: "icon", type: "image/png", href: "/feedy-mark.png?v=2" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/__grok/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      ],
    };
  },
  component: () => (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Shell>
            <Outlet />
          </Shell>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'setTimeout(function(){if(window.__feedyReady)return;var el=document.querySelector("[data-feedy-boot]");if(el)el.textContent="Feedy did not finish opening. Refresh the page. If it stays on this message, publish the app again.";},8000);',
          }}
        />
        <Scripts />
      </body>
    </html>
  ),
});
