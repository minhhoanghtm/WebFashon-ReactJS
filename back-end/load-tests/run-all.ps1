#!/usr/bin/env pwsh
# run-all.ps1 — Chạy k6, lưu chỉ phần summary cuối vào file txt

$tests = @(
    @{ file = "load-tests/products.js";       name = "products"       },
    @{ file = "load-tests/authentication.js"; name = "authentication" },
    @{ file = "load-tests/checkout.js";       name = "checkout"       },
    @{ file = "load-tests/voucher.js";        name = "voucher"        },
    @{ file = "load-tests/cart.js";           name = "cart"           },
    @{ file = "load-tests/order.js";          name = "order"          }
)

$passed = @()
$failed = @()

# ── Đọc summary JSON và ghi ra file txt dễ đọc ───────────────────────────────
function Write-Summary($jsonPath, $txtPath, $name, $stamp, $exitCode) {
    $overall = if ($exitCode -eq 0) { "ALL THRESHOLDS PASSED" } else { "SOME THRESHOLDS FAILED" }
    $json    = Get-Content $jsonPath -Raw | ConvertFrom-Json
    $metrics = $json.metrics

    $lines = @()
    $lines += "Test    : $name"
    $lines += "Run at  : $stamp"
    $lines += "Result  : $overall"
    $lines += ("-" * 50)

    # Thresholds
    $lines += ""
    $lines += "THRESHOLDS"
    foreach ($key in $metrics.PSObject.Properties.Name) {
        $m = $metrics.$key
        if ($null -eq $m.thresholds) { continue }
        foreach ($thr in $m.thresholds.PSObject.Properties.Name) {
            $pass = if ($m.thresholds.$thr -eq $false) { "PASS" } else { "FAIL" }
            $lines += "  [$pass]  $key  '$thr'"
        }
    }

    # Key metrics
    $lines += ""
    $lines += "METRICS"

    $dur = $metrics.'http_req_duration'
    if ($dur) {
        $lines += "  http_req_duration  avg=$([math]::Round($dur.values.avg))ms  p95=$([math]::Round($dur.values.'p(95)'))ms  max=$([math]::Round($dur.values.max))ms"
    }

    $fail = $metrics.'http_req_failed'
    if ($fail) {
        $lines += "  http_req_failed    $([math]::Round($fail.values.rate * 100, 2))%"
    }

    $reqs = $metrics.'http_reqs'
    if ($reqs) {
        $lines += "  http_reqs          total=$($reqs.values.count)  rate=$([math]::Round($reqs.values.rate, 2))/s"
    }

    $vus = $metrics.'vus_max'
    if ($vus) {
        $lines += "  vus_max            $($vus.values.max)"
    }

    $checks = $metrics.'checks'
    if ($checks) {
        $pass = [math]::Round($checks.values.rate * 100, 2)
        $lines += "  checks             $pass% passed"
    }

    # Endpoint latencies
    $epKeys = $metrics.PSObject.Properties.Name | Where-Object { $_ -match '\{endpoint:' }
    if ($epKeys) {
        $lines += ""
        $lines += "ENDPOINTS"
        foreach ($ep in $epKeys) {
            $v = $metrics.$ep.values
            $lines += "  $ep"
            $lines += "    avg=$([math]::Round($v.avg))ms  p95=$([math]::Round($v.'p(95)'))ms"
        }
    }

    $lines | Set-Content -Path $txtPath -Encoding UTF8
}

# ── Main loop ─────────────────────────────────────────────────────────────────
foreach ($t in $tests) {
    $name    = $t.name
    $stamp   = Get-Date -Format "yyyy-MM-dd_HH-mm"
    $jsonOut = "load-tests/results/${name}_${stamp}.json"
    $txtOut  = "load-tests/results/${name}_${stamp}.txt"

    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "  Running: $name" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan

    # k6 hiển thị full output ra terminal, summary JSON lưu riêng
    k6 run --summary-export $jsonOut $t.file
    $exitCode = $LASTEXITCODE

    # Ghi file txt từ JSON
    if (Test-Path $jsonOut) {
        Write-Summary $jsonOut $txtOut $name $stamp $exitCode
        Remove-Item $jsonOut   # xoá JSON tạm, chỉ giữ txt
        Write-Host "Saved: $txtOut" -ForegroundColor Yellow
    }

    if ($exitCode -eq 0) { $passed += $name } else { $failed += $name }

    if ($t -ne $tests[-1]) {
        Write-Host "`nWaiting 30s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    }
}

# Tổng kết
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
foreach ($t in $passed) { Write-Host "  PASS  $t" -ForegroundColor Green }
foreach ($t in $failed) { Write-Host "  FAIL  $t" -ForegroundColor Red   }
if ($failed.Count -eq 0) {
    Write-Host "`nAll tests passed." -ForegroundColor Green
} else {
    Write-Host "`n$($failed.Count) test(s) failed." -ForegroundColor Red
    exit 1
}
