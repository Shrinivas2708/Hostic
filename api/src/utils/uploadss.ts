import puppeteer from 'puppeteer';
import ImageKit from 'imagekit';
import crypto from 'crypto';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function captureAndUploadScreenshot(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 630 });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

  // Convert to Node.js Buffer
  const screenshot = await page.screenshot({ type: 'png'});
  const buffer = Buffer.from(screenshot); // ✅ Fix for Uint8Array -> Buffer

  await browser.close();

  const fileName = `${crypto.randomUUID()}.png`;

  // Properly await the result and assert the type
  const result = await imagekit.upload({
    file: buffer,
    fileName,
    folder: '/previews',
    useUniqueFileName: true,
  });

  return result.url; // ✅ fix: result is awaited and now typed
}
