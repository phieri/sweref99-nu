script.js:
	tsc

sr9.wasm:
	emcc src/sr9.c
	touch _site/sr9.wasm
	touch _site/sr9.js
