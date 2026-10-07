const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

// Evaluate the real formatter without requiring a browser DOM for this unit test.
const source = readFileSync(path.join(__dirname, "../src/static/app.js"), "utf8");
const start = source.indexOf("  function formatSchedule(details) {");
const end = source.indexOf("  // Function to determine activity type", start);
assert.ok(start >= 0 && end > start, "schedule formatter must exist");
const context = {};
vm.runInNewContext(source.slice(start, end), context);
const { formatSchedule } = context;

test("start-only schedules do not invent an end time", () => {
  assert.equal(formatSchedule({ schedule_details: {
    days: ["Tuesday"], start_time: "19:00"
  }}), "Tuesday, 7:00 PM");
});

test("existing full schedules keep their start and end times", () => {
  assert.equal(formatSchedule({ schedule_details: {
    days: ["Monday", "Friday"], start_time: "15:15", end_time: "16:45"
  }}), "Monday, Friday, 3:15 PM - 4:45 PM");
});

test("legacy string schedules remain supported", () => {
  assert.equal(formatSchedule({ schedule: "Tuesdays at 7:00 PM" }), "Tuesdays at 7:00 PM");
});
