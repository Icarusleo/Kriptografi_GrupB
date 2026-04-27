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

function Build-ElephantVariant(
  [string]$variantDir,
  [string]$bridgeFile,
  [string]$exportName,
  [string]$outputBase,
  [string[]]$variantSources
) {
  $refDir = Join-Path $root "..\elephant\elephant\Implementations\crypto_aead\$variantDir\ref"
  $bridge = Join-Path $pkg "c\$bridgeFile"
  $sourceFiles = @("$bridge", (Join-Path $refDir "encrypt.c")) + $variantSources

  emcc `
    @sourceFiles `
    -I(Join-Path $pkg "c") `
    -I"$refDir" `
    -O3 `
    -s MODULARIZE=1 `
    -s EXPORT_ES6=1 `
    -s ALLOW_MEMORY_GROWTH=1 `
    -s EXPORTED_RUNTIME_METHODS="['cwrap','HEAPU8']" `
    -s EXPORTED_FUNCTIONS="['_$exportName','_malloc','_free']" `
    -o (Join-Path $outDir "$outputBase.js")

  if ($LASTEXITCODE -ne 0) {
    throw "$variantDir WASM build basarisiz oldu (exit code $LASTEXITCODE)."
  }
}

Build-ElephantVariant -variantDir "elephant160v2" -bridgeFile "elephant_bridge.c" -exportName "elephant160_aead_encrypt" -outputBase "elephant160_wasm" -variantSources @((Join-Path $root "..\elephant\elephant\Implementations\crypto_aead\elephant160v2\ref\spongent.c"))
Build-ElephantVariant -variantDir "elephant176v2" -bridgeFile "elephant176_bridge.c" -exportName "elephant176_aead_encrypt" -outputBase "elephant176_wasm" -variantSources @((Join-Path $root "..\elephant\elephant\Implementations\crypto_aead\elephant176v2\ref\spongent.c"))
Build-ElephantVariant -variantDir "elephant200v2" -bridgeFile "elephant200_bridge.c" -exportName "elephant200_aead_encrypt" -outputBase "elephant200_wasm" -variantSources @((Join-Path $root "..\elephant\elephant\Implementations\crypto_aead\elephant200v2\ref\keccak.c"))

Write-Host "Elephant (160/176/200) WASM build tamamlandi: $outDir"
