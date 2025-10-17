import { createRoot } from "react-dom/client";

const example = new URLSearchParams(window.location.search).get("example") ?? "fetch";

const { default: Root } = await (
  {
    fetch: () => import("./App"),
  }[example] ?? (() => import("./App"))
)();
createRoot(document.querySelector("#root")!).render(<Root />);
