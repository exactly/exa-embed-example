import { useEffect, useRef } from "react";

import hostExaApp from "./hostExaApp"; // host SDK: expose APIs to the iframe

export function App() {
  const exaApp = useRef<HTMLIFrameElement>(null); // hold iframe element reference

  useEffect(() => {
    const iframe = exaApp.current;
    if (!iframe) return;

    // initialize miniapp host integration
    const host = hostExaApp({
      iframe, // exa app iframe element
      clientFid: 69, // integrator client id; replace with a unique value
      platformType: "web", // integrator platform type
      request: (method, params) =>
        fetch("/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method, params }),
        }).then((response) => {
          if (!response.ok) throw new Error(`${method} failed: ${response.status}`);
          return response.json();
        }),
    });

    return () => host.cleanup(); // teardown host SDK on unmount
  }, []); // run once on mount

  return (
    <iframe
      ref={exaApp}
      title="Exa App" // accessible name for screen readers
      src="https://sandbox.exactly.app" // sandbox origin; replace with https://web.exactly.app in production
      allow="clipboard-read; clipboard-write; camera" // address UX: copy/paste addresses; scan address QR codes
      loading="eager" // load immediately; primary content
    />
  );
}
