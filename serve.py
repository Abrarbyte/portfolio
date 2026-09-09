#!/usr/bin/env python3
"""Static server that mirrors production compression + caching.

`python -m http.server` sends everything uncompressed, so it under-reports what a
real host delivers. This serves the same files with brotli/gzip negotiation and
sane cache headers, so the Network panel here matches what visitors would get.

    python serve.py [port]        # default 8788
"""
import http.server
import gzip
import mimetypes
import os
import socketserver
import sys

try:
    import brotli
except ImportError:
    brotli = None

# Python's mimetypes knows none of these; without them everything ships as
# application/octet-stream, which is one more variable when debugging load
# failures. Real hosts send these correctly.
for ext, mime in {
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.mjs': 'application/javascript',
}.items():
    mimetypes.add_type(mime, ext)

# Only text-ish formats benefit. glb is uncompressed binary and gains ~45%.
# webp/woff2/mp3/png are already compressed - recompressing wastes CPU for ~0%.
COMPRESSIBLE = {'.js', '.css', '.html', '.json', '.svg', '.txt', '.map', '.glb', '.gltf'}
IMMUTABLE_DIRS = ('/_next/static/',)
LONG_CACHE = {'.woff2', '.webp', '.glb', '.mp3', '.png', '.svg', '.jpg'}


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def _encoding_for(self, ext):
        if ext not in COMPRESSIBLE:
            return None
        accepted = self.headers.get('Accept-Encoding', '')
        if brotli and 'br' in accepted:
            return 'br'
        if 'gzip' in accepted:
            return 'gzip'
        return None

    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            index = os.path.join(path, 'index.html')
            if os.path.exists(index):
                path = index
            else:
                return super().do_GET()
        if not os.path.isfile(path):
            return super().do_GET()

        ext = os.path.splitext(path)[1].lower()
        with open(path, 'rb') as fh:
            body = fh.read()
        raw_len = len(body)

        encoding = self._encoding_for(ext)
        if encoding == 'br':
            body = brotli.compress(body, quality=5)
        elif encoding == 'gzip':
            body = gzip.compress(body, 6)

        self.send_response(200)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Length', str(len(body)))
        if encoding:
            self.send_header('Content-Encoding', encoding)
            self.send_header('Vary', 'Accept-Encoding')
        if any(d in self.path for d in IMMUTABLE_DIRS):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        elif ext in LONG_CACHE:
            self.send_header('Cache-Control', 'public, max-age=604800')
        else:
            self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

        if encoding:
            saved = 100 * (1 - len(body) / raw_len) if raw_len else 0
            sys.stderr.write('%s  %d -> %d bytes (%s, -%.0f%%)\n'
                             % (self.path, raw_len, len(body), encoding, saved))


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8788
    if brotli is None:
        sys.stderr.write('note: brotli module not installed - falling back to gzip\n')
    with Server(('127.0.0.1', port), Handler) as httpd:
        print('serving %s on http://127.0.0.1:%d' % (os.getcwd(), port))
        httpd.serve_forever()
