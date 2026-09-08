"""Tiny static file server for the portfolio.

Railway sets the PORT environment variable; locally it falls back
to 8641. Serves everything under ./site.
"""
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get("PORT", 8641))
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "public, max-age=0, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    print(f"Serving {ROOT} on 0.0.0.0:{PORT}")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
