script.js:
	tsc src/script.ts --verbose --outfile _site/script.js
	mv sr9.wasm _site/sr9.wasm

sr9.wasm:
	emcc src/sr9.c
	touch sr9.wasm
	touch sr9.js
