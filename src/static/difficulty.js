// An omitted difficulty is an activity for all levels, not an active filter.
const ActivityDifficulty = {
  levels: ["Beginner", "Intermediate", "Advanced"],

  label(details) {
    return this.levels.includes(details.difficulty) ? details.difficulty : "";
  },

  matches(details, selectedDifficulty) {
    if (!selectedDifficulty) return true;
    if (selectedDifficulty === "All") {
      return details.difficulty == null || details.difficulty === "";
    }
    return this.levels.includes(selectedDifficulty) && details.difficulty === selectedDifficulty;
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ActivityDifficulty;
}
