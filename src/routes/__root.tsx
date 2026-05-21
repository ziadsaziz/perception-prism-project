import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { MirrorBackdrop } from "@/components/MirrorBackdrop";
import manifestUrl from "../../public/manifest.json?url";
import icon192Url from "../../public/icon-192.png?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">MIRROR · 404</p>
        <h1 className="mt-3 font-display text-4xl text-gradient">Nothing reflects back.</h1>
        <p className="mt-3 text-sm text-muted-foreground">This page isn't being read by anyone.</p>
        <Link to="/home" className="mt-6 inline-block rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.2em] bg-foreground text-background">Return</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-[10px] uppercase tracking-[0.3em] text-crimson">MIRROR · INTERFERENCE</p>
        <h1 className="mt-3 font-display text-3xl text-gradient">The signal dropped.</h1>
        <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.2em] bg-foreground text-background">Re-read</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#000000" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Mirror" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "MIRROR — See yourself the way the world sees you." },
      { name: "description", content: "MIRROR is a private AI perception engine. It studies the signals people feel but rarely say out loud." },
      { property: "og:title", content: "MIRROR — See yourself the way the world sees you." },
      { property: "og:description", content: "MIRROR is a private AI perception engine. It studies the signals people feel but rarely say out loud." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MIRROR — See yourself the way the world sees you." },
      { name: "twitter:description", content: "MIRROR is a private AI perception engine. It studies the signals people feel but rarely say out loud." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cd6b8fda-6a1a-4956-a07b-8aba533bc83e/id-preview-f9f3135c--bbdad320-a996-4fa8-a34e-c1fd0befcb17.lovable.app-1779316680217.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cd6b8fda-6a1a-4956-a07b-8aba533bc83e/id-preview-f9f3135c--bbdad320-a996-4fa8-a34e-c1fd0befcb17.lovable.app-1779316680217.png" },
    ],
    links: [
      { rel: "manifest", href: manifestUrl },
      { rel: "apple-touch-icon", href: icon192Url },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Inter:wght@300;400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body className="dark min-h-screen antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    })();
    const isPreviewHost =
      window.location.hostname.includes("id-preview--") ||
      window.location.hostname.includes("lovableproject.com");
    if (isPreviewHost || isInIframe) {
      navigator.serviceWorker?.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
      return;
    }
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MirrorBackdrop />
        <div className="mx-auto max-w-md min-h-screen">
          <Outlet />
        </div>
        <Toaster theme="dark" position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
