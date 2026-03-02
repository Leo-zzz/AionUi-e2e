import { mergeTests } from '@playwright/test';
import { electronAppFixture } from './electron-app.fixture';
import { networkFixture } from './network.fixture';

export const test = mergeTests(electronAppFixture, networkFixture);
export { expect } from '@playwright/test';
