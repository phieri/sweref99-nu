script.js:
	tsc

sr9.wasm sr9.js: src/sr9.cpp
	emcc -O2 -s WASM=1 -s EXPORTED_FUNCTIONS='["_wgs84_to_sweref99tm"]' \
	  -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
	  -I build/include/ \
	  build/libproj.a  \
	  src/sr9.cpp -o sr9.js

_site/sr9.wasm _site/sr9.js: sr9.wasm sr9.js
	cp sr9.wasm _site/sr9.wasm
	cp sr9.js _site/sr9.js
