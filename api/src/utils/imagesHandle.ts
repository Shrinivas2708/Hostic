import puppeteer from 'puppeteer';
import ImageKit from 'imagekit';
import { UploadResponse } from 'imagekit/dist/libs/interfaces';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function captureAndUploadScreenshot(
  url: string,
  name: string
): Promise<UploadResponse> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    // await page.waitForTimeout(1000); // optional wait

    const screenshot = await page.screenshot({ type: 'png' });
    const buffer = Buffer.from(screenshot);

    const fileName = `${name}.png`;
    const result = await imagekit.upload({
      file: buffer,
      fileName,
      folder: '/previews',
      useUniqueFileName: true,
    });

    return result;
  } finally {
    await browser.close();
  }
}
export async function Delete(fileId: string): Promise<boolean> {
  try {
    await imagekit.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error("❌ Image deletion failed:", error);
    throw new Error("Failed to delete image from ImageKit");
  }
}
