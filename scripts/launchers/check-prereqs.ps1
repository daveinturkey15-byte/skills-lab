<#
    check-prereqs.ps1 — what is actually installed for the out-of-browser lanes.

    Some techniques in this showcase genuinely do not run in a browser. Their
    rooms carry a launcher rather than a fake demo, and a launcher that lies
    about what is installed is worse than no launcher — so this reports only
    what it can see on disk, and says OPEN where it cannot tell.

    It never downloads, installs, or changes anything. It looks and it reports.

    Usage:  powershell -File check-prereqs.ps1 -Lane comfyui-trellis
            powershell -File check-prereqs.ps1 -Lane ue5-game-recording
            powershell -File check-prereqs.ps1 -Lane blender-remesh
#>
param([Parameter(Mandatory = $true)][string]$Lane)

$ErrorActionPreference = 'Continue'

function Or($value, $fallback) {
    # Windows PowerShell 5.1 has no null-coalescing operator; hence this helper.
    if ($null -eq $value -or ($value -is [string] -and $value -eq '')) { return $fallback }
    return $value
}

function Row($name, $ok, $detail) {
    $mark = if ($ok -eq $true) { '  OK  ' } elseif ($ok -eq $false) { ' MISS ' } else { ' OPEN ' }
    Write-Host ("[{0}] {1,-34} {2}" -f $mark, $name, $detail)
}

function FirstExisting([string[]]$paths) {
    foreach ($p in $paths) { if ($p -and (Test-Path $p)) { return $p } }
    return $null
}

Write-Host ""
Write-Host "Skills Lab launcher - prerequisites for: $Lane"
Write-Host ("-" * 74)

switch ($Lane) {

  'comfyui-trellis' {
    # Image -> textured mesh, locally. Established 2026-09-17: ComfyUI on this
    # machine already ships the Trellis.2 nodes built in; only the checkpoint is
    # missing, so this is much closer to working than it looks.
    $comfy = FirstExisting @(
      'C:\Users\david\projects\baby-drag-onz-tools\ComfyUI',
      'C:\Users\david\Desktop\stuff\Comfy Fun\ComfyUI',
      "$env:USERPROFILE\ComfyUI"
    )
    Row 'ComfyUI install' ($null -ne $comfy) (Or $comfy 'not found in the three known locations')

    if ($comfy) {
      $node = Join-Path $comfy 'comfy_extras\nodes_trellis2.py'
      Row 'Built-in Trellis.2 nodes' (Test-Path $node) $(if (Test-Path $node) { 'present - no custom node pack needed' } else { 'comfy_extras\nodes_trellis2.py not found' })

      $ckptDir = Join-Path $comfy 'models\checkpoints'
      $found = @()
      if (Test-Path $ckptDir) {
        $found = Get-ChildItem $ckptDir -Recurse -File -ErrorAction SilentlyContinue |
                 Where-Object { $_.Name -match 'trellis' }
      }
      Row 'Trellis checkpoint' ($found.Count -gt 0) $(if ($found.Count) { "$($found.Count) file(s): $($found[0].Name)" } else { "none under models\checkpoints - THIS is the only missing piece" })

      $py = FirstExisting @((Join-Path $comfy '..\python_embeded\python.exe'), (Join-Path $comfy 'venv\Scripts\python.exe'))
      Row 'Python for ComfyUI' ($null -ne $py) (Or $py 'no embedded python or venv beside the install')
    }

    $nv = (Get-CimInstance Win32_VideoController | Where-Object { $_.Name -match 'NVIDIA' } | Select-Object -First 1)
    Row 'NVIDIA GPU' ($null -ne $nv) (Or $nv.Name 'none detected')

    Write-Host ""
    Write-Host "To finish this lane: place a Trellis.2 checkpoint under models\checkpoints,"
    Write-Host "then start ComfyUI and use the built-in Trellis nodes. Nothing else is missing."
    Write-Host "Licence note: check the checkpoint's own terms - model weights are licensed"
    Write-Host "separately from the code that runs them, and often more restrictively."
  }

  'ue5-game-recording' {
    # Game recording -> engine import. The ecosystem here is largely
    # Discord-distributed with no public repository, which is a real constraint
    # rather than a gap in the search, and the launcher says so.
    $ue = Get-ChildItem 'C:\Program Files\Epic Games' -Directory -ErrorAction SilentlyContinue |
          Where-Object { $_.Name -match '^UE_5' } | Sort-Object Name -Descending | Select-Object -First 1
    Row 'Unreal Engine 5' ($null -ne $ue) (Or $ue.FullName 'no UE_5* under C:\Program Files\Epic Games')

    $steam = FirstExisting @('C:\Program Files (x86)\Steam\steamapps', 'D:\SteamLibrary\steamapps')
    $bo2 = $null
    if ($steam) {
      $bo2 = Get-ChildItem $steam -Directory -ErrorAction SilentlyContinue |
             Where-Object { $_.Name -match 'Black Ops|BlackOps|t6' } | Select-Object -First 1
    }
    Row 'Steam library' ($null -ne $steam) (Or $steam 'not found')
    Row 'Black Ops II install' ($null -ne $bo2) (Or $bo2.FullName 'not detected - required as the private-use source')

    Row 'C2M / C2UE extractor' $null 'Discord-distributed, no public repository. Not installable from here.'
    Row 'AGRPLUGIN' $null 'Unreleased. Whether it is private, gated or unpublished is OPEN.'

    Write-Host ""
    Write-Host "Read first: docs/launchers/ue5-game-recording.md"
    Write-Host ""
    Write-Host "TWO THINGS THAT ARE NOT OPTIONAL:"
    Write-Host " * Extracted commercial game assets are PRIVATE USE ONLY. Never redistribute"
    Write-Host "   them, never commit them, never publish a build containing them."
    Write-Host " * C2M-class tools read live game process memory. Running one against a"
    Write-Host "   VAC-secured multiplayer session risks a ban. Single-player or offline only."
  }

  'blender-remesh' {
    $blender = Get-ChildItem 'C:\Program Files\Blender Foundation' -Directory -ErrorAction SilentlyContinue |
               Sort-Object Name -Descending | Select-Object -First 1
    Row 'Blender' ($null -ne $blender) (Or $blender.FullName 'not found under Program Files\Blender Foundation')
    if ($blender) {
      $exe = Join-Path $blender.FullName 'blender.exe'
      Row 'blender.exe' (Test-Path $exe) $exe
      $rigify = Get-ChildItem $blender.FullName -Recurse -Directory -Filter 'rigify' -ErrorAction SilentlyContinue | Select-Object -First 1
      Row 'Rigify addon' ($null -ne $rigify) $(if ($rigify) { 'bundled' } else { 'not found - enable it in Preferences > Add-ons' })
      $gltf = Get-ChildItem $blender.FullName -Recurse -Directory -Filter 'io_scene_gltf2' -ErrorAction SilentlyContinue | Select-Object -First 1
      Row 'glTF exporter' ($null -ne $gltf) $(if ($gltf) { 'bundled' } else { 'not found' })
    }
    Write-Host ""
    Write-Host "The in-browser room next door shows the resulting LODs. This lane is how"
    Write-Host "they were produced: high-poly in, decimate, bake attributes to the low-poly,"
    Write-Host "export glTF. Keep max 4 bone influences or three.js drops the extras."
  }

  default { Write-Host "Unknown lane '$Lane'." ; exit 2 }
}

Write-Host ("-" * 74)
Write-Host "Nothing was downloaded, installed or changed. This check only looked."
Write-Host ""
