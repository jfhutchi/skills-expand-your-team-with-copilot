const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const helperPath = path.join(__dirname, "../src/static/difficulty.js");
const difficulty = existsSync(helperPath) ? require(helperPath) : {};

function matches(details, filter) {
  assert.equal(typeof difficulty.matches, "function", "difficulty matching must be implemented");
  return difficulty.matches(details, filter);
}

function label(details) {
  assert.equal(typeof difficulty.label, "function", "difficulty labels must be implemented");
  return difficulty.label(details);
}

const levels = ["Beginner", "Intermediate", "Advanced"];

test("no difficulty filter includes both labelled and legacy activities", () => {
  for (const details of [{}, ...levels.map((level) => ({ difficulty: level }))]) {
    assert.equal(matches(details, ""), true);
  }
});

test("All only matches missing, null, or empty difficulty", () => {
  for (const details of [{}, { difficulty: null }, { difficulty: "" }]) {
    assert.equal(matches(details, "All"), true);
  }
  for (const level of levels) {
    assert.equal(matches({ difficulty: level }, "All"), false);
  }
});

for (const level of levels) {
  test(`${level} matches only activities with that explicit level`, () => {
    assert.equal(matches({ difficulty: level }, level), true);
    assert.equal(matches({}, level), false);
    for (const other of levels.filter((candidate) => candidate !== level)) {
      assert.equal(matches({ difficulty: other }, level), false);
    }
  });
  test(`${level} produces its readable card label`, () => {
    assert.equal(label({ difficulty: level }), level);
  });
}

test("unspecified difficulty never produces a card label", () => {
  for (const details of [{}, { difficulty: null }, { difficulty: "" }]) {
    assert.equal(label(details), "");
  }
});

test("invalid difficulty is neither injected into a label nor treated as All", () => {
  for (const value of ["Expert", "<img src=x onerror=alert(1)>", "beginner", 0, false]) {
    assert.equal(label({ difficulty: value }), "");
    assert.equal(matches({ difficulty: value }, "All"), false);
  }
  assert.equal(matches({ difficulty: "Expert" }, "Expert"), false);
});
