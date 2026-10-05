import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const ROOT = "http://127.0.0.1:8765";

const SHOTS = [
  { page: "poster.html", out: "/workspace/public/store/ios-6.7-01.png", w: 430, h: 932, scale: 3 },
  { page: "poster.html", out: "/workspace/public/store/ios-6.9-01.png", w: 440, h: 956, scale: 3 },
  { page: "poster.html", out: "/workspace/public/store/play-phone-01.png", w: 360, h: 640, scale: 3 },
  { page: "banner.html", out: "/workspace/.grok/play-feature-raw.png", w: 1024, h: 500, scale: 2 },
  { page: "banner.html", out: "/workspace/.grok/og-raw.png", w: 1200, h: 630, scale: 2 },
];

mkdirSync("/workspace/public/store", { recursive: true });

const browser = await chromium.launch({ args: ["--disable-web-security"] });
for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: { width: shot.w, height: shot.h },
    deviceScaleFactor: shot.scale,
  });
  const page = await context.newPage();
  await page.goto(`${ROOT}/${shot.page}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(80);
  await page.screenshot({ path: shot.out, type: "png" });
  await context.close();
  console.log("wrote", shot.out);
}
await browser.close();
