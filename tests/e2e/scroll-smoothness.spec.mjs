import { createTestBrowser } from "./helpers.mjs";

const VIEWPORTS = [
  { name: "Desktop (1920x1080)", width: 1920, height: 1080, isTouch: false },
  { name: "Laptop (1366x768)", width: 1366, height: 768, isTouch: false },
  { name: "Mobile (390x844)", width: 390, height: 844, isTouch: true },
];

export async function runScrollSmoothnessTest(browser) {
  const allResults = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.isTouch,
      isMobile: vp.isTouch,
    });
    const page = await context.newPage();

    // Setup performance observers before navigation
    await page.addInitScript(() => {
      window.__perfMetrics = {
        longTasks: [],
        cls: 0,
        samples: [],
      };

      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              window.__perfMetrics.longTasks.push({
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          }
        });
        longTaskObserver.observe({ type: "longtask", buffered: true });
      } catch (e) {
        // Long task observer might not be supported in all contexts
      }

      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__perfMetrics.cls += entry.value;
            }
          }
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });
      } catch (e) {
        // Layout shift observer fallback
      }
    });

    await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Start tracking RAF scrollY samples
    await page.evaluate(() => {
      window.__isTracking = true;
      window.__samples = [];
      let running = true;
      function recordFrame(now) {
        if (!running) return;
        window.__samples.push({ t: now, y: window.scrollY });
        requestAnimationFrame(recordFrame);
      }
      requestAnimationFrame(recordFrame);
      window.__stopTracking = () => {
        running = false;
      };
    });

    // Simulate scrolling: Down then Up
    if (!vp.isTouch) {
      // 1. Wheel scrolling down (mouse wheel delta notches)
      for (let i = 0; i < 20; i++) {
        await page.mouse.wheel(0, 180);
        await page.waitForTimeout(60);
      }
      // Pause
      await page.waitForTimeout(600);

      // 2. Touchpad small delta scrolling down
      for (let i = 0; i < 40; i++) {
        await page.mouse.wheel(0, 45);
        await page.waitForTimeout(25);
      }
      // Wait for stabilization
      await page.waitForTimeout(800);

      // 3. Wheel scrolling back up
      for (let i = 0; i < 25; i++) {
        await page.mouse.wheel(0, -150);
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(800);
    } else {
      // Mobile touch / wheel scroll simulation
      for (let i = 0; i < 25; i++) {
        await page.mouse.wheel(0, 120);
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(600);

      for (let i = 0; i < 20; i++) {
        await page.mouse.wheel(0, -120);
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(800);
    }

    // Stop tracking & collect metrics
    const analysis = await page.evaluate(() => {
      window.__stopTracking();
      const samples = window.__samples || [];
      const perf = window.__perfMetrics || { longTasks: [], cls: 0 };

      // Compute frame deltas
      const activeDeltas = [];
      let unintentionalReversals = 0;
      let maxJump = 0;

      for (let i = 1; i < samples.length; i++) {
        const dy = samples[i].y - samples[i - 1].y;
        const absDy = Math.abs(dy);
        if (absDy > 0.5) {
          activeDeltas.push(absDy);
          if (absDy > maxJump) maxJump = absDy;
        }

        // Check for jitter/reversals during continuous scrolling:
        // If previous step was substantial positive (>15) and current step is negative (<-5) without user pause
        if (i >= 2) {
          const prevDy = samples[i - 1].y - samples[i - 2].y;
          const dt = samples[i].t - samples[i - 1].t;
          if (prevDy > 15 && dy < -5 && dt < 40) {
            unintentionalReversals++;
          } else if (prevDy < -15 && dy > 5 && dt < 40) {
            unintentionalReversals++;
          }
        }
      }

      // Median step
      let medianStep = 0;
      if (activeDeltas.length > 0) {
        const sorted = [...activeDeltas].sort((a, b) => a - b);
        medianStep = sorted[Math.floor(sorted.length / 2)];
      }

      // Frames with jump > 3x median
      const outlierFrames = activeDeltas.filter((d) => d > Math.max(medianStep * 3, 40)).length;
      const outlierRatio = activeDeltas.length > 0 ? (outlierFrames / activeDeltas.length) * 100 : 0;

      return {
        totalFrames: samples.length,
        activeFrames: activeDeltas.length,
        maxJump: Math.round(maxJump * 10) / 10,
        medianStep: Math.round(medianStep * 10) / 10,
        unintentionalReversals,
        outlierFrames,
        outlierRatio: Math.round(outlierRatio * 10) / 10,
        longTasksCount: perf.longTasks.length,
        maxLongTask: perf.longTasks.reduce((max, t) => Math.max(max, t.duration), 0),
        cls: Math.round(perf.cls * 1000) / 1000,
      };
    });

    allResults.push({
      viewport: vp.name,
      ...analysis,
    });

    await context.close();
  }

  return allResults;
}

// Standalone runner
if (process.argv[1]?.endsWith("scroll-smoothness.spec.mjs")) {
  (async () => {
    const browser = await createTestBrowser();
    try {
      console.log("=== RUNNING SCROLL SMOOTHNESS AUDIT ===");
      const results = await runScrollSmoothnessTest(browser);
      console.table(results);
      console.log(JSON.stringify(results, null, 2));
    } finally {
      await browser.close();
    }
  })();
}

