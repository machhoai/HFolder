import { describe, expect, it } from "vitest";
import {
  ancestorIssues,
  displayPath,
  fold,
  selectRange,
} from "../../src/features/explorer/model";
import type { Entry } from "../../src/contracts";

describe("selection follows visible order", () => {
  const ids = ["a", "b", "c", "d"];
  it("supports Ctrl toggling, Shift ranges and adding a range", () => {
    expect(selectRange(ids, ["a"], "c", "a", true, false)).toEqual(["a", "c"]);
    expect(selectRange(ids, ["a", "c"], "a", "a", true, false)).toEqual(["c"]);
    expect(selectRange(ids, ["a"], "c", "a", false, true)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(selectRange(ids, ["d"], "b", "a", true, true)).toEqual([
      "d",
      "a",
      "b",
    ]);
  });
  it("does not use missing anchors after filtering", () => {
    expect(selectRange(["b", "c"], ["a"], "c", "a", false, true)).toEqual([
      "c",
    ]);
  });
});
it("folds Vietnamese text and preserves canonical display paths", () => {
  expect(fold("HỢP ĐỒNG Đặng")).toBe("hop dong dang");
  expect(displayPath("\\\\?\\D:\\Work", "01 Projects")).toBe(
    "D:\\Work\\01 Projects",
  );
});
it("counts entries, not individual issues, and respects path boundaries", () => {
  const entries = [
    { relativePath: "01 A\\01.01 B", issues: ["UNTRACKED", "MISSING_CODE"] },
    { relativePath: "01 AB\\01.01 Other", issues: ["CHANGED"] },
  ] as Entry[];
  expect(ancestorIssues(entries, "01 A")).toBe(1);
});
