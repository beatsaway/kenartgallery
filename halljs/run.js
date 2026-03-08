/**
 * Fetches the year's gallery.json, applies config + popup + artwork descriptions, then loads controls and gallery.
 * Set window.GALLERY_JSON_URL (e.g. 'gallery.json') before loading this script.
 */
(function() {
    var url = window.GALLERY_JSON_URL || 'gallery.json';
    fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var popup = data.popup || {};
            var popupEl = document.createElement('div');
            popupEl.id = 'hall-popup';
            popupEl.className = popup.showOnLoad !== false ? 'show-on-load visible' : '';
            popupEl.innerHTML = (popup.html || '').replace(/\n/g, '<br>');
            document.body.appendChild(popupEl);

            window.GALLERY_CONFIG = data.gallery || {};
            try {
                var resolved = new URL(url, document.baseURI || window.location.href);
                window.GALLERY_BASE = resolved.pathname.replace(/\/[^/]*$/, '/');
            } catch (e) { window.GALLERY_BASE = ''; }
            window.artworkDescriptions = data.artworkDescriptions || [];
            window.parseArtworkDescription = function(index) {
                var d = window.artworkDescriptions[index];
                if (d && typeof d === 'object') return { title: d.title || 'Untitled', description: d.description || 'No description available.' };
                return { title: 'Unknown Artwork', description: 'No description available.' };
            };

            var base = (document.baseURI || window.location.href).replace(/\/[^/]*$/, '/');
            function loadScript(src, next) {
                var s = document.createElement('script');
                s.src = base + src;
                s.onload = next && next.length ? function() { loadScript(next[0], next.slice(1)); } : null;
                document.body.appendChild(s);
            }
            loadScript('../halljs/controls.js', ['../halljs/gallery.js']);
        })
        .catch(function(err) {
            console.error('Failed to load gallery config from ' + url, err);
        });
})();
