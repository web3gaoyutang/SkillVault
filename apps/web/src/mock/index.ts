/**
 * SkillVault Mock Data Layer
 *
 * Enables frontend development without a running backend.
 *
 * ## How to enable
 *
 * Option 1 — Environment variable (build-time):
 *   VITE_MOCK=true npm run dev
 *
 * Option 2 — localStorage (runtime, no rebuild):
 *   Open browser console and run:
 *     localStorage.setItem('mock', 'true')
 *   Then reload the page.
 *
 * ## How to disable
 *   localStorage.removeItem('mock')
 *   Then reload.
 *
 * When enabled, a purple console message confirms:
 *   [SkillVault] Mock mode enabled — API calls return mock data
 */
export { isMockEnabled, installMockInterceptor, installFetchMock } from './handlers';
