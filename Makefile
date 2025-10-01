script.js:
	tsc

# Generate app icons from SVG source
icons: _site/favicon.ico _site/apple-touch-icon.png _site/icon-192.png _site/icon-512.png

_site/favicon.ico: src/icon.svg
	rsvg-convert -w 32 -h 32 src/icon.svg -o /tmp/icon-32.png
	rsvg-convert -w 16 -h 16 src/icon.svg -o /tmp/icon-16.png
	rsvg-convert -w 48 -h 48 src/icon.svg -o /tmp/icon-48.png
	convert /tmp/icon-16.png /tmp/icon-32.png /tmp/icon-48.png _site/favicon.ico
	rm /tmp/icon-16.png /tmp/icon-32.png /tmp/icon-48.png

_site/apple-touch-icon.png: src/icon.svg
	rsvg-convert -w 180 -h 180 src/icon.svg -o _site/apple-touch-icon.png

_site/icon-192.png: src/icon.svg
	rsvg-convert -w 192 -h 192 src/icon.svg -o _site/icon-192.png

_site/icon-512.png: src/icon.svg
	rsvg-convert -w 512 -h 512 src/icon.svg -o _site/icon-512.png
