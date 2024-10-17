script.js:
	tsc

sr9.wasm:
	emcc -O0 -s WASM=1 -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
    -I include/proj \
    sr9.cpp \
    src/**.cpp \
	-o sr9.js
	touch _site/sr9.wasm
	touch _site/sr9.js
