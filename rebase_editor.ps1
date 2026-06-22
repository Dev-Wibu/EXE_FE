#!/usr/bin/env pwsh
param($path)
(Get-Content $path) -replace '^pick', 'edit' | Set-Content $path
