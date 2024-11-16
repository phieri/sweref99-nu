script.js:
	tsc

sr9.wasm:
	emcc -O0 -s WASM=1 -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
    -I libs/proj/include \
    src/sr9.cpp \
	-o sr9.js
	touch _site/sr9.wasm
	touch _site/sr9.js
