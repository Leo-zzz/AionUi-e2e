import { test as base, _electron, ElectronApplication, Page } from '@playwright/test';
import { resolve } from 'path';

/** Default path to AionUi source project */
const DEFAULT_AION_UI_PATH = 'D:/code/AionUi';

/** Find the renderer window (skip DevTools) */
async function getAppWindow(app: ElectronApplication): Promise<Page> {
  // firstWindow() may return DevTools, so wait then find the real one
  await app.firstWindow();
  // Give time for the renderer window to open
  await new Promise((r) => setTimeout(r, 3000));

  const windows = app.windows();
  const appWindow = windows.find((w) => !w.url().startsWith('devtools://'));
  if (appWindow) return appWindow;

  // Fallback: wait for next window event
  return app.waitForEvent('window', {
    predicate: (page) => !page.url().startsWith('devtools://'),
    timeout: 15_000,
  });
}

export type ElectronAppFixtures = {
  electronApp: ElectronApplication;
  page: Page;
};

export const electronAppFixture = base.extend<ElectronAppFixtures>({
  electronApp: async ({}, use) => {
    const appPath = process.env.AION_APP_PATH;
    const uiPath = process.env.AION_UI_PATH || DEFAULT_AION_UI_PATH;

    let app: ElectronApplication;

    if (appPath) {
      // Packaged app mode: launch the executable directly
      app = await _electron.launch({
        executablePath: appPath,
        env: { ...process.env },
      });
    } else {
      // Dev mode: pass the project root so Electron reads package.json
      // (picks up "name": "AionUi" and "main": "./out/main/index.js")
      // This ensures userData points to AppData/Roaming/AionUi/
      app = await _electron.launch({
        args: [uiPath],
        env: { ...process.env },
        cwd: uiPath,
      });
    }

    await use(app);

    // Release single-instance lock before closing so the next test can acquire it
    try {
      await app.evaluate(({ app: electronApp }) => {
        electronApp.releaseSingleInstanceLock();
      });
    } catch {
      // App may already be closed
    }
    await app.close();

    // Give OS time to fully release the lock and port
    await new Promise((r) => setTimeout(r, 1000));
  },

  page: async ({ electronApp }, use) => {
    const page = await getAppWindow(electronApp);

    // Maximize the window to ensure all UI elements are accessible
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows().find((w) => !w.webContents.getURL().startsWith('devtools://'));
      if (win) win.maximize();
    });
    await page.waitForTimeout(500);

    // Wait for the app shell to be present
    await page.waitForSelector('.app-shell', { timeout: 30_000 });
    await use(page);
  },
});
