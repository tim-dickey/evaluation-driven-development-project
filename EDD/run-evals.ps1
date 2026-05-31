#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FixtureDir = Join-Path $RootDir 'fixtures/spec-to-implementation'
$Runner = Join-Path $RootDir 'spec_to_impl_eval_runner.py'
$Atlas = Join-Path $RootDir 'atlas_entry.py'
$PythonBin = if ($env:PYTHON_BIN) { $env:PYTHON_BIN } else { 'python' }
$Failures = 0

if (!(Test-Path $Runner)) {
    Write-Host "Missing runner: $Runner"
    exit 1
}

if (!(Test-Path $Atlas)) {
    Write-Host "Missing Atlas mock: $Atlas"
    exit 1
}

if (!(Test-Path $FixtureDir)) {
    Write-Host "Missing fixture directory: $FixtureDir"
    exit 1
}

Write-Host 'Running spec-to-implementation evals...'
Get-ChildItem $FixtureDir -Filter *.json | ForEach-Object {
    Write-Host "  - $($_.Name)"
    try {
        & $PythonBin $Runner $_.FullName --atlas-cmd "$PythonBin $Atlas"
        if ($LASTEXITCODE -ne 0) { $Failures++ }
    }
    catch {
        $Failures++
    }
}

if ($Failures -gt 0) {
    Write-Host "Evals failed: $Failures"
    exit 1
}

Write-Host 'All evals passed.'
