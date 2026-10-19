import { describe, expect, it } from 'vitest';
import { SettingsKey } from '../../core/enums/SettingsKey';
import { buildExtensionContext } from '../../test/unit/fakes';
import { SettingsStateManager } from './SettingsStateManager';

describe('SettingsStateManager', () => {
  it('returns the default value for missing keys', () => {
    const { extensionContext } = buildExtensionContext();
    const settings = new SettingsStateManager(extensionContext);

    expect(settings.get(SettingsKey.ShowFilters, true)).toBe(true);
  });

  it('persists values in the global state', async () => {
    const { extensionContext, context } = buildExtensionContext();
    const settings = new SettingsStateManager(extensionContext);

    await settings.set(SettingsKey.SortType, 'recent');

    expect(settings.get(SettingsKey.SortType, 'favorites')).toBe('recent');
    expect(context.globalState.get(SettingsKey.SortType)).toBe('recent');
  });
});
