import http.server
import socketserver
import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Set up the handler for file changes
class ChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if not event.is_directory:
            print(f"File changed: {event.src_path}")
            # Reload the page by sending a refresh header
            self.server.last_modified = time.time()

# Create a custom handler that includes auto-refresh
class AutoRefreshHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Add auto-refresh meta tag to HTML files
        if self.path.endswith('.html'):
            with open('public' + self.path, 'rb') as f:
                content = f.read()
                if b'</head>' in content:
                    refresh_tag = b'<meta http-equiv="refresh" content="1">'
                    content = content.replace(b'</head>', refresh_tag + b'</head>')
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(content)
        else:
            super().do_GET()

def run_server():
    PORT = 8000
    handler = AutoRefreshHandler
    handler.server = handler()
    handler.server.last_modified = time.time()

    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        
        # Set up the file system observer
        event_handler = ChangeHandler()
        event_handler.server = handler.server
        observer = Observer()
        observer.schedule(event_handler, path='public', recursive=True)
        observer.start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            observer.stop()
            print("\nShutting down server...")
        observer.join()

if __name__ == "__main__":
    run_server() 