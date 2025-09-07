script.js:
	tsc

sr9.wasm sr9.js: src/sr9.cpp
	emcc -Os -s WASM=1 -s EXPORTED_FUNCTIONS='["_wgs84_to_sweref99tm", "_free"]' \
	  -s EXPORTED_RUNTIME_METHODS='["cwrap", "getValue"]' \
	  -I build/include/ \
	  build/libproj.a build/libsqlite3.a \
	  src/sr9.cpp -o sr9.js

_site/sr9.wasm _site/sr9.js: sr9.wasm sr9.js
	cp sr9.wasm _site/sr9.wasm
	cp sr9.js _site/sr9.js
