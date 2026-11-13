"""Local visual preview. No Home Assistant access, no credentials."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        route = path.split("?", 1)[0]
        if route.startswith("/euskalmet_local_static/"):
            relative = route.removeprefix("/euskalmet_local_static/")
            base = ROOT / "custom_components" / "euskalmet_local" / "frontend"
        else:
            relative = route.lstrip("/") or "preview.html"
            base = ROOT / "docs"
        target = (base / relative).resolve()
        if not target.is_relative_to(base.resolve()):
            return str(base / "not-found")
        return str(target)


if __name__ == "__main__":
    print("Preview: http://127.0.0.1:8793", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8793), Handler).serve_forever()
