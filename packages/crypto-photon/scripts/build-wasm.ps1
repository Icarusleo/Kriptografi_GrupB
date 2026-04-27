$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\..\.."
$pkg = Resolve-Path "$PSScriptRoot\.."
$outDir = Join-Path $root "apps\web\public"

if (-not (Get-Command emcc -ErrorAction SilentlyContinue)) {
  Write-Error "emcc bulunamadi. Emscripten kurup tekrar deneyin."
}

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$bridge = Join-Path $pkg "c\photon_beetle_bridge.c"
$aeadRefDir = Join-Path $root "photon-beetle\Implementations\crypto_aead\photonbeetleaead128rate32v1\ref"

emcc `
  "$bridge" `
  (Join-Path $aeadRefDir "encrypt.c") `
  (Join-Path $aeadRefDir "photon.c") `
  -I"$aeadRefDir" `
  -I(Join-Path $root "photon-beetle\Implementations") `
  -O3 `
  -s MODULARIZE=1 `
  -s EXPORT_ES6=1 `
  -s ALLOW_MEMORY_GROWTH=1 `
  -s EXPORTED_RUNTIME_METHODS="['cwrap','HEAPU8']" `
  -s EXPORTED_FUNCTIONS="['_photon_beetle_aead_encrypt','_malloc','_free']" `
  -o (Join-Path $outDir "photon_beetle_wasm.js")

if ($LASTEXITCODE -ne 0) {
  throw "WASM build basarisiz oldu (exit code $LASTEXITCODE)."
}

Write-Host "WASM build tamamlandi: $outDir"
