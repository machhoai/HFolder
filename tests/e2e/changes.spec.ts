import { test, expect } from "@playwright/test";

async function installBridge(
  page: import("@playwright/test").Page,
  recovery = false,
) {
  await page.addInitScript(
    ({ recovery }) => {
      const project = {
        id: "repair-project",
        name: "Hồ sơ dự án",
        root: "D:\\HFolder-Test",
        widths: [2, 2, 3],
        types: [{ id: "contract", name: "Hợp đồng" }],
        tags: [{ id: "important", name: "Quan trọng" }],
      };
      const entries = ["Hợp đồng.pdf", "hd2.pdf"].map((name, i) => ({
        id: `file-${i}`,
        relativePath: name,
        parent: "",
        name,
        isDir: false,
        size: 100,
        modified: Date.now() * 1e6,
        code: null,
        hidden: false,
        excluded: false,
        exists: true,
        issues: ["MISSING_CODE", "UNTRACKED"],
        kind: "",
        tags: [],
      }));
      let pending = recovery,
        completed = false,
        attempts = 0;
      const view = () => ({
        project,
        entries: pending ? [] : entries,
        issueCount: completed ? 0 : 2,
        recoveryRequired: pending,
      });
      const invoke = async (command: string, args: Record<string, unknown>) => {
        if (command === "list_projects") return [project];
        if (command === "get_project") return view();
        if (command === "recover_changes") {
          pending = false;
          return view();
        }
        if (command === "preview_changes") {
          const inputs = args.inputs as {
            id: string;
            description: string | null;
            number: number | null;
            kind: string | null;
            tags: string[] | null;
          }[];
          if (
            inputs.length !== 2 ||
            inputs.some(
              (i) =>
                i.description !== null ||
                i.kind !== "contract" ||
                i.tags?.[0] !== "important",
            )
          )
            throw {
              code: "TEST_INVALID_INPUT",
              detail: JSON.stringify(inputs),
            };
          return {
            id: "plan-1",
            changes: entries.map((e, i) => ({
              entryId: e.id,
              before: e.relativePath,
              after: i ? "02 hd2.pdf" : "01 Hop_dong.pdf",
              code: i ? "02" : "01",
              kind: "contract",
              tags: ["important"],
            })),
          };
        }
        if (command === "apply_changes") {
          if (++attempts === 1)
            throw { code: "STALE_PREVIEW", detail: "external change" };
          for (const [i, e] of entries.entries()) {
            e.name = i ? "02 hd2.pdf" : "01 Hop_dong.pdf";
            e.relativePath = e.name;
            e.code = (i ? "02" : "01") as never;
            e.issues = [];
            e.kind = "contract";
            e.tags = ["important"] as never;
          }
          completed = true;
          return view();
        }
        throw { code: "UNEXPECTED_COMMAND", detail: command };
      };
      Object.defineProperty(window, "isTauri", { value: true });
      Object.defineProperty(window, "__TAURI_INTERNALS__", {
        value: { invoke },
      });
    },
    { recovery },
  );
}

test("batch reconciliation previews classification and requires fresh preview after stale apply", async ({
  page,
}) => {
  await installBridge(page);
  await page.goto("/");
  const rows = page.getByRole("listbox").getByRole("option");
  await rows.first().click();
  await rows.nth(1).click({ modifiers: ["Control"] });
  await rows.first().click({ button: "right" });
  await page
    .getByRole("menuitem", { name: "Giữ tên và chuẩn hóa", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("textbox").first()).toHaveAttribute(
    "readonly",
    "",
  );
  await dialog
    .getByLabel("Áp dụng loại cho các mục đã chọn")
    .selectOption("contract");
  await dialog.getByLabel("Thay nhãn của các mục đã chọn").check();
  await dialog.getByRole("button", { name: "Quan trọng", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Xem trước thay đổi", exact: true })
    .click();
  await expect(
    dialog.getByRole("cell", {
      name: "01 Hop_dong.pdf Hợp đồng · Quan trọng",
      exact: true,
    }),
  ).toBeVisible();
  if (process.env.HFOLDER_SCREENSHOTS)
    await page.screenshot({
      path: `${process.env.HFOLDER_SCREENSHOTS}/HFolder-repair-preview.png`,
    });
  await page.setViewportSize({ width: 900, height: 640 });
  await expect(
    dialog.getByRole("button", { name: "Áp dụng thay đổi", exact: true }),
  ).toBeInViewport();
  await dialog
    .getByRole("button", { name: "Áp dụng thay đổi", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "tạo bản xem trước mới",
  );
  await expect(dialog.getByRole("alert")).toBeFocused();
  await dialog.getByRole("button", { name: "Quay lại", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Xem trước thay đổi", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Áp dụng thay đổi", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Mới", exact: true }),
  ).toBeEnabled();
  await expect(rows.filter({ hasText: "01 Hop_dong.pdf" })).toHaveCount(1);
});

test("unfinished journal blocks new folders and exposes explicit recovery", async ({
  page,
}) => {
  await installBridge(page, true);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Mới", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Phục hồi thao tác trước", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Phục hồi thao tác trước", exact: true }),
  ).toBeHidden();
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(2);
});
