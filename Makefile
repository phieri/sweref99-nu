script.js: sr9.wasm
tsc script.ts
mv script.js _site/script.js
mv sr9.wasm _site/sr9.wasm

sr9.wasm:
touch sr9.wasm

index.html:
cp src/index.html _site/index.html

om.html:
cp src/om.html _site/om.html
