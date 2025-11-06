import { createRoot } from "react-dom/client";

const example = new URLSearchParams(window.location.search).get("example") ?? "fetch";

const { default: Root } = await (
  {
    fetch: () => import("./examples/Fetch"),
    sequence: () => import("./examples/Sequence"),
  }[example] ?? (() => import("./examples/Sequence"))
)();
createRoot(document.querySelector("#root")!).render(<Root />);
