import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generatePDFs() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const submissionPath = path.resolve(__dirname, 'submission.html');
  const appendixPath = path.resolve(__dirname, 'appendix.html');
  const outDir = path.resolve(__dirname, '..', 'final');

  console.log('Generating 2-page submission PDF...');
  await page.goto(`file:///${submissionPath.replace(/\\/g, '/')}`);
  await page.waitForTimeout(1000);
  await page.pdf({
    path: path.join(outDir, 'Briqen_Creator_Studio_2_Page_Assignment.pdf'),
    format: 'A4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
  });
  console.log('  → Briqen_Creator_Studio_2_Page_Assignment.pdf');

  console.log('Generating AI appendix PDF...');
  await page.goto(`file:///${appendixPath.replace(/\\/g, '/')}`);
  await page.waitForTimeout(1000);
  await page.pdf({
    path: path.join(outDir, 'Briqen_AI_Use_Appendix.pdf'),
    format: 'A4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
  });
  console.log('  → Briqen_AI_Use_Appendix.pdf');

  await browser.close();
  console.log('Done. PDFs saved to final/');
}

generatePDFs().catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
