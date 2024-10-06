script.js: sr9.wasm
	tsc src/script.ts --outfile _site/script.js
	mv sr9.wasm _site/sr9.wasm

sr9.wasm:
	touch sr9.wasm
