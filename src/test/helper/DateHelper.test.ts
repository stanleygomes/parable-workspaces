import * as assert from 'assert';
import { DateHelper } from '../../helper/DateHelper';

suite('DateHelper Test Suite', () => {
  suite('toHumanRelative', () => {
    test('should return "just now" when timestamp is close to now', () => {
      const now = Date.now();
      const result = DateHelper.toHumanRelative(now - 5000); // 5 seconds ago
      assert.strictEqual(result, 'just now');
    });

    test('should return relative seconds when timestamp is within a minute in the past', () => {
      const now = Date.now();
      const result = DateHelper.toHumanRelative(now - 30000); // 30 seconds ago
      assert.strictEqual(result, '30 seconds ago');
    });

    test('should return relative seconds in future when timestamp is within a minute in the future', () => {
      const now = Date.now();
      const result = DateHelper.toHumanRelative(now + 30000); // 30 seconds from now
      assert.strictEqual(result, 'in 30 seconds');
    });

    test('should return relative minutes when timestamp is within an hour in the past', () => {
      const now = Date.now();
      const result = DateHelper.toHumanRelative(now - 10 * 60 * 1000); // 10 minutes ago
      assert.strictEqual(result, '10 minutes ago');
    });

    test('should return relative hours when timestamp is within a day in the past', () => {
      const now = Date.now();
      const result = DateHelper.toHumanRelative(now - 5 * 60 * 60 * 1000); // 5 hours ago
      assert.strictEqual(result, '5 hours ago');
    });

    test('should return relative days when timestamp is within a month in the past', () => {
      const now = Date.now();
      const result = DateHelper.toHumanRelative(now - 4 * 24 * 60 * 60 * 1000); // 4 days ago
      assert.strictEqual(result, '4 days ago');
    });

    test('should return relative months when timestamp is within a year in the past', () => {
      const now = Date.now();
      const result = DateHelper.toHumanRelative(now - 60 * 24 * 60 * 60 * 1000); // ~2 months ago
      assert.strictEqual(result, '2 months ago');
    });

    test('should return relative years when timestamp is more than a year in the past', () => {
      const now = Date.now();
      const result = DateHelper.toHumanRelative(now - 400 * 24 * 60 * 60 * 1000); // ~1.1 years ago
      assert.strictEqual(result, '1 year ago');
    });
  });

  suite('startOfDay', () => {
    test('should return date at 00:00:00.000 when any date is provided', () => {
      const date = new Date(2026, 5, 29, 15, 30, 45, 123);
      const start = DateHelper.startOfDay(date);
      assert.strictEqual(start.getFullYear(), 2026);
      assert.strictEqual(start.getMonth(), 5);
      assert.strictEqual(start.getDate(), 29);
      assert.strictEqual(start.getHours(), 0);
      assert.strictEqual(start.getMinutes(), 0);
      assert.strictEqual(start.getSeconds(), 0);
      assert.strictEqual(start.getMilliseconds(), 0);
    });
  });

  suite('startOfWeek', () => {
    test('should return date at the start of the week when a date is provided', () => {
      // 2026-06-29 is a Monday (d.getDay() === 1)
      const date = new Date(2026, 5, 29, 15, 30, 45, 123);
      const start = DateHelper.startOfWeek(date);
      // Start of week should be Sunday, 2026-06-28
      assert.strictEqual(start.getFullYear(), 2026);
      assert.strictEqual(start.getMonth(), 5);
      assert.strictEqual(start.getDate(), 28);
      assert.strictEqual(start.getHours(), 0);
      assert.strictEqual(start.getMinutes(), 0);
      assert.strictEqual(start.getSeconds(), 0);
      assert.strictEqual(start.getMilliseconds(), 0);
    });
  });

  suite('startOfMonth', () => {
    test('should return date at the first day of the month when a date is provided', () => {
      const date = new Date(2026, 5, 29, 15, 30, 45, 123);
      const start = DateHelper.startOfMonth(date);
      assert.strictEqual(start.getFullYear(), 2026);
      assert.strictEqual(start.getMonth(), 5);
      assert.strictEqual(start.getDate(), 1);
      assert.strictEqual(start.getHours(), 0);
      assert.strictEqual(start.getMinutes(), 0);
      assert.strictEqual(start.getSeconds(), 0);
      assert.strictEqual(start.getMilliseconds(), 0);
    });
  });

  suite('nowMs', () => {
    test('should return current timestamp in milliseconds when invoked', () => {
      const before = Date.now();
      const result = DateHelper.nowMs();
      const after = Date.now();
      assert.ok(result >= before && result <= after);
    });
  });
});
