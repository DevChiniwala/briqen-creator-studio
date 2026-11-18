import { test, expect } from '@playwright/test';

test.describe('Briqen Creator Studio — Full Scenario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.removeItem('briqen-editor-v1');
    });
    await page.reload({ waitUntil: 'networkidle' });
  });

  test('1. Initial state: Scene 1 approved, Scene 2 running, export disabled', async ({ page }) => {
    const state = await page.evaluate(() => window.__briqenDemo?.getState());
    expect(state).toBeTruthy();
    expect(state!.sceneOrder).toEqual(['s2', 's1']);
    expect(state!.scenesById.s1.approvedAssetId).toBe('asset_approved_01');
    expect(state!.scenesById.s1.durationSec).toBe(5);
    expect(state!.scenesById.s2.durationSec).toBe(3);
    expect(state!.jobsBySceneId.s2.status).toBe('running');

    const exportBtn = page.locator('button:has-text("Export draft")');
    await expect(exportBtn).toBeDisabled();
  });

  test('2. Fail generation preserves all edits and Scene 1 approved asset', async ({ page }) => {
    const before = await page.evaluate(() => window.__briqenDemo?.getState());

    await page.evaluate(() => window.__briqenDemo?.fail());

    const after = await page.evaluate(() => window.__briqenDemo?.getState());
    expect(after!.sceneOrder).toEqual(before!.sceneOrder);
    expect(after!.scenesById.s2.durationSec).toBe(3);
    expect(after!.scenesById.s2.script).toBe(before!.scenesById.s2.script);
    expect(after!.scenesById.s1.approvedAssetId).toBe('asset_approved_01');
    expect(after!.scenesById.s1.durationSec).toBe(5);
    expect(after!.jobsBySceneId.s2.status).toBe('failed');

    const exportBtn = page.locator('button:has-text("Export draft")');
    await expect(exportBtn).toBeDisabled();
  });

  test('3. Retry creates new attempt with current script, preserves edits', async ({ page }) => {
    await page.evaluate(() => window.__briqenDemo?.fail());
    const beforeRetry = await page.evaluate(() => window.__briqenDemo?.getState());

    await page.evaluate(() => window.__briqenDemo?.retry());

    const afterRetry = await page.evaluate(() => window.__briqenDemo?.getState());
    expect(afterRetry!.jobsBySceneId.s2.status).toBe('running');
    expect(afterRetry!.sceneOrder).toEqual(beforeRetry!.sceneOrder);
    expect(afterRetry!.scenesById.s2.durationSec).toBe(beforeRetry!.scenesById.s2.durationSec);
    expect(afterRetry!.scenesById.s2.script).toBe(beforeRetry!.scenesById.s2.script);
    expect(afterRetry!.scenesById.s1.approvedAssetId).toBe('asset_approved_01');
    expect(afterRetry!.jobsBySceneId.s2.inputSnapshot.script).toBe(afterRetry!.scenesById.s2.script);
  });

  test('4. Success marks as succeeded but does not auto-approve', async ({ page }) => {
    await page.evaluate(() => window.__briqenDemo?.fail());
    await page.evaluate(() => window.__briqenDemo?.retry());
    await page.evaluate(() => window.__briqenDemo?.success());

    const state = await page.evaluate(() => window.__briqenDemo?.getState());
    expect(state!.jobsBySceneId.s2.status).toBe('succeeded');
    expect(state!.scenesById.s2.approvedAssetId).toBeNull();

    const exportBtn = page.locator('button:has-text("Export draft")');
    await expect(exportBtn).toBeDisabled();
  });

  test('4b. Approve after success enables export', async ({ page }) => {
    await page.evaluate(() => window.__briqenDemo?.fail());
    await page.evaluate(() => window.__briqenDemo?.retry());
    await page.evaluate(() => window.__briqenDemo?.success());

    await page.evaluate(() => window.__briqenDemo?.approve());

    const state = await page.evaluate(() => window.__briqenDemo?.getState());
    expect(state!.scenesById.s2.approvedAssetId).toBeTruthy();

    const exportBtn = page.locator('button:has-text("Export draft")');
    await expect(exportBtn).toBeEnabled();
  });

  test('5. Reset restores initial state', async ({ page }) => {
    await page.evaluate(() => window.__briqenDemo?.fail());
    await page.evaluate(() => window.__briqenDemo?.reset());

    const state = await page.evaluate(() => window.__briqenDemo?.getState());
    expect(state!.sceneOrder).toEqual(['s2', 's1']);
    expect(state!.scenesById.s2.durationSec).toBe(3);
    expect(state!.jobsBySceneId.s2.status).toBe('running');
    expect(state!.scenesById.s1.approvedAssetId).toBe('asset_approved_01');
  });

  test('6. Screenshot: generating state', async ({ page }) => {
    await page.evaluate(() => window.__briqenDemo?.reset());
    await page.waitForTimeout(300);
    await page.screenshot({
      path: 'final/screenshots/editor_generating.png',
      fullPage: true,
    });
  });

  test('7. Screenshot: failed state', async ({ page }) => {
    await page.evaluate(() => window.__briqenDemo?.reset());
    await page.evaluate(() => window.__briqenDemo?.fail());
    await page.waitForTimeout(300);
    await page.screenshot({
      path: 'final/screenshots/editor_failed.png',
      fullPage: true,
    });
  });

  test('8. No console errors during scenario', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.evaluate(() => window.__briqenDemo?.reset());
    await page.evaluate(() => window.__briqenDemo?.fail());
    await page.evaluate(() => window.__briqenDemo?.retry());
    await page.evaluate(() => window.__briqenDemo?.success());
    await page.evaluate(() => window.__briqenDemo?.reset());

    expect(errors).toEqual([]);
  });

  test('9. UI walkthrough: reorder, trim, fail, retry, approve, export', async ({ page }) => {
    // Verify initial state via UI
    const exportBtn = page.locator('button:has-text("Export draft")');
    await expect(exportBtn).toBeDisabled();

    // Reorder: Scene 2 is at position 0, move Scene 1 earlier to swap order
    await page.click('button[aria-label="Move Scene 01 earlier"]');
    await page.waitForTimeout(300);

    // Select Scene 2 by clicking its card
    await page.click('[aria-label="Select Scene 02"]');
    await page.waitForTimeout(300);

    // Trim duration: decrease from 3.0s to 2.5s
    await page.click('button[aria-label="Decrease duration"]');
    await page.waitForTimeout(300);
    const state1 = await page.evaluate(() => window.__briqenDemo?.getState());
    expect(state1!.scenesById.s2.durationSec).toBe(2.5);

    // Fail via demo button
    await page.click('button:has-text("1. Fail")');
    await page.waitForTimeout(500);

    // Verify Retry button appears in Inspector and click it
    await page.click('button:has-text("↻ Retry")');
    await page.waitForTimeout(500);

    // Succeed via demo button
    await page.click('button:has-text("2. Succeed")');
    await page.waitForTimeout(500);

    // Approve via Inspector approve button
    await page.click('button:has-text("✓ Approve")');
    await page.waitForTimeout(500);

    // Verify export is now enabled
    await expect(exportBtn).toBeEnabled();

    // Verify scene edits were preserved through the whole flow
    const finalState = await page.evaluate(() => window.__briqenDemo?.getState());
    expect(finalState!.sceneOrder).toEqual(['s1', 's2']);
    expect(finalState!.scenesById.s2.durationSec).toBe(2.5);
    expect(finalState!.scenesById.s1.approvedAssetId).toBe('asset_approved_01');
    expect(finalState!.scenesById.s2.approvedAssetId).toBeTruthy();
  });
});
