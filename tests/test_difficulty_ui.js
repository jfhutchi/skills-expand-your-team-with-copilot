const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ActivityDifficulty = require("../src/static/difficulty.js");

const source = readFileSync(path.join(__dirname, "../src/static/app.js"), "utf8");
const html = readFileSync(path.join(__dirname, "../src/static/index.html"), "utf8");

// Run the application's actual functions. Only browser elements/network edges are
// replaced; the filtering and card rendering are not reimplemented by these tests.
function evaluate(context, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${startMarker.trim()} must exist`);
  vm.runInNewContext(source.slice(start, end), context);
}

const base = {
  description: "Create software projects", schedule: "Tuesday at 3:00 PM",
  schedule_details: { days: ["Tuesday"], start_time: "15:00", end_time: "16:00" },
  max_participants: 15, participants: [],
};
const fixtures = {
  "Open Club": { ...base },
  "Beginner Coding": { ...base, difficulty: "Beginner" },
  "Intermediate Art": { ...base, description: "Paint and drawing", difficulty: "Intermediate" },
  "Advanced Robotics": { ...base, difficulty: "Advanced", schedule_details: {
    days: ["Saturday"], start_time: "15:00", end_time: "16:00"
  } },
};

function filteredNames(overrides = {}) {
  const names = [];
  const context = {
    ActivityDifficulty, allActivities: fixtures, currentFilter: "all", currentDifficulty: "",
    currentTimeRange: "", searchQuery: "", timeRanges: { weekend: { days: ["Saturday", "Sunday"] } },
    activitiesList: { innerHTML: "" }, renderActivityCard: name => names.push(name), ...overrides,
  };
  evaluate(context, "  function formatSchedule(details) {", "  // Function to fetch activities");
  evaluate(context, "  function displayFilteredActivities() {", "  // Function to render a single activity card");
  context.displayFilteredActivities();
  return { names, message: context.activitiesList.innerHTML };
}

test("the real activity list distinguishes unfiltered view from All-level activities", () => {
  assert.deepEqual(filteredNames().names, Object.keys(fixtures));
  assert.deepEqual(filteredNames({ currentDifficulty: "All" }).names, ["Open Club"]);
});

test("difficulty combines with the existing category, search, and weekend filters", () => {
  assert.deepEqual(filteredNames({ currentDifficulty: "Beginner" }).names, ["Beginner Coding"]);
  assert.deepEqual(filteredNames({ currentDifficulty: "Beginner", currentFilter: "arts" }).names, []);
  assert.deepEqual(filteredNames({ currentDifficulty: "Intermediate", currentFilter: "arts" }).names, ["Intermediate Art"]);
  assert.deepEqual(filteredNames({ currentDifficulty: "Advanced", searchQuery: "coding" }).names, []);
  assert.deepEqual(filteredNames({ currentDifficulty: "Advanced", searchQuery: "ROBOTICS" }).names, ["Advanced Robotics"]);
  assert.deepEqual(filteredNames({ currentDifficulty: "Beginner", currentTimeRange: "weekend" }).names, []);
  assert.deepEqual(filteredNames({ currentDifficulty: "Advanced", currentTimeRange: "weekend" }).names, ["Advanced Robotics"]);
  assert.match(filteredNames({ currentDifficulty: "Beginner", searchQuery: "not found" }).message, /No activities found/);
});

function cardHtml(details) {
  const cards = [];
  const context = {
    ActivityDifficulty, currentUser: null,
    activityTypes: { academic: { label: "Academic", color: "white", textColor: "black" } },
    getActivityType: () => "academic", formatSchedule: () => "Tuesday at 3:00 PM",
    document: { createElement: () => ({ innerHTML: "", querySelectorAll: () => [] }) },
    activitiesList: { appendChild: card => cards.push(card) },
  };
  evaluate(context, "  function renderActivityCard(name, details) {", "  // Event listeners for search and filter");
  context.renderActivityCard("Test Club", { ...base, ...details });
  return cards[0].innerHTML;
}

test("real cards label explicit levels and omit difficulty for legacy activities", () => {
  for (const level of ActivityDifficulty.levels) {
    assert.match(cardHtml({ difficulty: level }), new RegExp(`class="difficulty-label"[^>]*>\\s*<strong>Difficulty:</strong> ${level}`));
  }
  for (const difficulty of [undefined, null, "", "<img src=x>"]) {
    assert.doesNotMatch(cardHtml({ difficulty }), /difficulty-label|<img src=x>/);
  }
});

test("the sidebar exposes an unfiltered option and explains the special All option", () => {
  for (const value of ["", "All", ...ActivityDifficulty.levels]) {
    assert.ok(html.includes(`data-difficulty="${value}"`));
  }
  assert.match(html, /Any difficulty/);
  assert.match(html, /All shows only activities with no specified difficulty/);
  assert.ok(html.indexOf('src="difficulty.js"') < html.indexOf('src="app.js"'));
});

test("difficulty button clicks update state, accessible pressed state, and reset cleanly", () => {
  const buttons = ["", "All", ...ActivityDifficulty.levels].map(difficulty => ({
    dataset: { difficulty }, classes: new Set(), attributes: {}, listeners: {},
    classList: {
      toggle(value, enabled) { enabled ? this.owner.classes.add(value) : this.owner.classes.delete(value); },
    },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    addEventListener(name, handler) { this.listeners[name] = handler; },
  }));
  buttons.forEach(button => { button.classList.owner = button; });
  let renders = 0;
  const context = { difficultyFilters: buttons, currentDifficulty: "", displayFilteredActivities: () => renders++ };
  evaluate(context, "  function setDifficultyFilter(difficulty) {", "  // Check if user is already logged in");
  evaluate(context, "  // Add event listeners for difficulty filter buttons", "  // Open registration modal");
  buttons[2].listeners.click();
  assert.equal(context.currentDifficulty, "Beginner");
  assert.equal(buttons[2].attributes["aria-pressed"], "true");
  assert.equal(buttons[1].attributes["aria-pressed"], "false");
  assert.equal(buttons.filter(button => button.classes.has("active")).length, 1);
  buttons[2].listeners.click();
  buttons[0].listeners.click();
  assert.equal(context.currentDifficulty, "");
  assert.equal(buttons[0].attributes["aria-pressed"], "true");
  assert.equal(renders, 3);
});

test("difficulty focus uses the shared theme focus color when present", () => {
  const css = readFileSync(path.join(__dirname, "../src/static/styles.css"), "utf8");
  assert.match(css, /\.difficulty-filter:focus-visible\s*\{[^}]*var\(--focus-ring, var\(--primary-light\)\)/);
});
