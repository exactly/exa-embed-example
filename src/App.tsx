import { useLayoutEffect, useRef } from "react";

import hostExaApp from "./hostExaApp"; // host SDK: expose APIs to the iframe

export function App() {
  const exaApp = useRef<HTMLIFrameElement>(null); // hold iframe element reference

  useLayoutEffect(() => {
    const iframe = exaApp.current;
    if (!iframe) return;

    // initialize miniapp host integration
    const host = hostExaApp({
      iframe, // exa app iframe element
      appUrl: "http://localhost:5173/", // deep link to exa app inside the embedding client
      clientFid: 69, // integrator client id; replace with a unique value
      platformType: "web", // integrator platform type
      chainId: 10,
      request: (method, params) =>
        fetch("/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method, params }),
        }).then((response) => {
          if (!response.ok) throw new Error(`${method} failed: ${response.status}`);
          return response.json();
        }),
      ready() {
        const splashScreen = document.querySelector(".splash-screen");
        if (splashScreen) splashScreen.remove();
      },
    });

    return () => host.cleanup(); // teardown host SDK on unmount
  }, []); // run once on mount

  return (
    <>
      <iframe
        ref={exaApp}
        title="Exa App" // accessible name for screen readers
        src="http://localhost:8081/" // sandbox origin; replace with https://web.exactly.app in production
        allow="clipboard-read; clipboard-write; camera" // address UX: copy/paste addresses; scan address QR codes
        loading="eager" // load immediately; primary content
      />
      <div className="splash-screen" style={{ position: "fixed", inset: 0, backgroundColor: "#000", zIndex: 9999 }} />
    </>
  );
}
