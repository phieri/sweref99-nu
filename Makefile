SPLASH_BACKGROUND := \#006AA7

script.js:
	./node_modules/.bin/tsc

# Generate app icons from SVG source
icons: \
	_site/favicon.ico \
	_site/apple-touch-icon.png \
	_site/icon-192.png \
	_site/icon-512.png \
	_site/images/splash-iphone.png \
	_site/images/splash-iphone-plus.png \
	_site/images/splash-iphone-se.png \
	_site/images/splash-iphone-landscape.png

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

_site/images/splash-iphone.png: src/icon.svg
	mkdir -p _site/images
	rsvg-convert -w 240 -h 240 src/icon.svg -o /tmp/splash-icon.png
	convert -size 390x844 xc:$(SPLASH_BACKGROUND) /tmp/splash-icon.png -gravity center -geometry +0-24 -composite _site/images/splash-iphone.png
	rm /tmp/splash-icon.png

_site/images/splash-iphone-plus.png: src/icon.svg
	mkdir -p _site/images
	rsvg-convert -w 260 -h 260 src/icon.svg -o /tmp/splash-icon.png
	convert -size 428x926 xc:$(SPLASH_BACKGROUND) /tmp/splash-icon.png -gravity center -geometry +0-28 -composite _site/images/splash-iphone-plus.png
	rm /tmp/splash-icon.png

_site/images/splash-iphone-se.png: src/icon.svg
	mkdir -p _site/images
	rsvg-convert -w 200 -h 200 src/icon.svg -o /tmp/splash-icon.png
	convert -size 320x568 xc:$(SPLASH_BACKGROUND) /tmp/splash-icon.png -gravity center -geometry +0-20 -composite _site/images/splash-iphone-se.png
	rm /tmp/splash-icon.png

_site/images/splash-iphone-landscape.png: src/icon.svg
	mkdir -p _site/images
	rsvg-convert -w 220 -h 220 src/icon.svg -o /tmp/splash-icon.png
	convert -size 844x390 xc:$(SPLASH_BACKGROUND) /tmp/splash-icon.png -gravity center -geometry +0-12 -composite _site/images/splash-iphone-landscape.png
	rm /tmp/splash-icon.png
