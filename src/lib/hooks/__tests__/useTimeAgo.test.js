import { describe, expect, it } from '@jest/globals';
import { addDays, subDays, subHours, subMinutes, subSeconds } from 'date-fns';
import { dateDiff } from '../useTimeAgo';
var base = new Date('2024-06-17T00:00:00Z');
describe('dateDiff', function () {
    it("works with numbers", function () {
        var earlier = subDays(base, 3);
        expect(dateDiff(earlier, Number(base))).toEqual({
            value: 3,
            unit: 'day',
            earlier: earlier,
            later: base,
        });
    });
    it("works with strings", function () {
        var earlier = subDays(base, 3);
        expect(dateDiff(earlier, base.toString())).toEqual({
            value: 3,
            unit: 'day',
            earlier: earlier,
            later: base,
        });
    });
    it("works with dates", function () {
        var earlier = subDays(base, 3);
        expect(dateDiff(earlier, base)).toEqual({
            value: 3,
            unit: 'day',
            earlier: earlier,
            later: base,
        });
    });
    it("equal values return now", function () {
        expect(dateDiff(base, base)).toEqual({
            value: 0,
            unit: 'now',
            earlier: base,
            later: base,
        });
    });
    it("future dates return now", function () {
        var earlier = addDays(base, 3);
        expect(dateDiff(earlier, base)).toEqual({
            value: 0,
            unit: 'now',
            earlier: earlier,
            later: base,
        });
    });
    it("values < 5 seconds ago return now", function () {
        var then = subSeconds(base, 4);
        expect(dateDiff(then, base)).toEqual({
            value: 0,
            unit: 'now',
            earlier: then,
            later: base,
        });
    });
    it("values >= 5 seconds ago return seconds", function () {
        var then = subSeconds(base, 5);
        expect(dateDiff(then, base)).toEqual({
            value: 5,
            unit: 'second',
            earlier: then,
            later: base,
        });
    });
    it("values < 1 min return seconds", function () {
        var then = subSeconds(base, 59);
        expect(dateDiff(then, base)).toEqual({
            value: 59,
            unit: 'second',
            earlier: then,
            later: base,
        });
    });
    it("values >= 1 min return minutes", function () {
        var then = subSeconds(base, 60);
        expect(dateDiff(then, base)).toEqual({
            value: 1,
            unit: 'minute',
            earlier: then,
            later: base,
        });
    });
    it("minutes round down", function () {
        var then = subSeconds(base, 119);
        expect(dateDiff(then, base)).toEqual({
            value: 1,
            unit: 'minute',
            earlier: then,
            later: base,
        });
    });
    it("values < 1 hour return minutes", function () {
        var then = subMinutes(base, 59);
        expect(dateDiff(then, base)).toEqual({
            value: 59,
            unit: 'minute',
            earlier: then,
            later: base,
        });
    });
    it("values >= 1 hour return hours", function () {
        var then = subMinutes(base, 60);
        expect(dateDiff(then, base)).toEqual({
            value: 1,
            unit: 'hour',
            earlier: then,
            later: base,
        });
    });
    it("hours round down", function () {
        var then = subMinutes(base, 119);
        expect(dateDiff(then, base)).toEqual({
            value: 1,
            unit: 'hour',
            earlier: then,
            later: base,
        });
    });
    it("values < 1 day return hours", function () {
        var then = subHours(base, 23);
        expect(dateDiff(then, base)).toEqual({
            value: 23,
            unit: 'hour',
            earlier: then,
            later: base,
        });
    });
    it("values >= 1 day return days", function () {
        var then = subHours(base, 24);
        expect(dateDiff(then, base)).toEqual({
            value: 1,
            unit: 'day',
            earlier: then,
            later: base,
        });
    });
    it("days round down", function () {
        var then = subHours(base, 47);
        expect(dateDiff(then, base)).toEqual({
            value: 1,
            unit: 'day',
            earlier: then,
            later: base,
        });
    });
    it("values < 30 days return days", function () {
        var then = subDays(base, 29);
        expect(dateDiff(then, base)).toEqual({
            value: 29,
            unit: 'day',
            earlier: then,
            later: base,
        });
    });
    it("values >= 30 days return months", function () {
        var then = subDays(base, 30);
        expect(dateDiff(then, base)).toEqual({
            value: 1,
            unit: 'month',
            earlier: then,
            later: base,
        });
    });
    it("months round down", function () {
        var then = subDays(base, 59);
        expect(dateDiff(then, base)).toEqual({
            value: 1,
            unit: 'month',
            earlier: then,
            later: base,
        });
    });
    it("values are rounded by increments of 30", function () {
        var then = subDays(base, 61);
        expect(dateDiff(then, base)).toEqual({
            value: 2,
            unit: 'month',
            earlier: then,
            later: base,
        });
    });
    it("values < 360 days return months", function () {
        var then = subDays(base, 359);
        expect(dateDiff(then, base)).toEqual({
            value: 11,
            unit: 'month',
            earlier: then,
            later: base,
        });
    });
    it("values >= 360 days return the earlier value", function () {
        var then = subDays(base, 360);
        expect(dateDiff(then, base)).toEqual({
            value: 12,
            unit: 'month',
            earlier: then,
            later: base,
        });
    });
});
