import { describe, expect, it } from 'vitest';
import { StringHelper } from './StringHelper';

describe('StringHelper', () => {
  it('replaces template variables without interpreting dollar signs', () => {
    const result = StringHelper.replace('Hello {{name}} costs {{price}}', {
      name: 'Parable',
      price: '$10',
    });

    expect(result).toBe('Hello Parable costs $10');
  });

  it('encodes values as base64', () => {
    const value = '/Users/jeremy/dev/opensource/parable-workspaces';

    expect(StringHelper.toBase64(value)).toBe(
      Buffer.from(value).toString('base64'),
    );
  });
});
