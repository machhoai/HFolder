import { test, expect } from "@playwright/test";

test("browser preview clearly requires desktop; i18n and theme preserve the shell", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Mọi tệp. Đúng vị trí." }),
  ).toBeVisible();
  await expect(
    page.getByText("Bạn đang xem giao diện trình duyệt.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tạo dự án", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Cài đặt", exact: true })
    .first()
    .click();
  await page.getByRole("combobox", { name: "Ngôn ngữ" }).selectOption("en");
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Every file. In its place." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Every file. In its place." }),
  ).toBeVisible();
});

test("desktop bridge UI: optional catalogs, setup gate, create folder and selection", async ({
  page,
}) => {
  // IPC contract double only; actual filesystem/persistence is verified separately by Rust tests.
  await page.addInitScript(() => {
    let project: Record<string, unknown> | null = null;
    const entries: Record<string, unknown>[] = [];
    const view = () => ({ project, entries: [...entries], issueCount: 0 });
    const internals = {
      invoke: async (command: string, args: Record<string, unknown>) => {
        if (command === "list_projects") return project ? [project] : [];
        if (command === "choose_root") return "D:\\HFolder-Test";
        if (command === "create_project") {
          project = { ...(args.input as object), id: "test-project" };
          return view();
        }
        if (command === "get_project") return view();
        if (command === "preview_folder") return "01 Ho_so_thanh_toan";
        if (command === "create_folder") {
          entries.push({
            id: "folder-1",
            name: "01 Ho_so_thanh_toan",
            relativePath: "01 Ho_so_thanh_toan",
            parent: "",
            isDir: true,
            size: 0,
            modified: Date.now() * 1e6,
            code: "01",
            hidden: false,
            excluded: false,
            exists: true,
            issues: [],
            kind: "",
            tags: [],
          });
          return view();
        }
        throw new Error(`Unexpected IPC: ${command}`);
      },
    };
    Object.defineProperty(window, "__TAURI_INTERNALS__", { value: internals });
    Object.defineProperty(window, "isTauri", { value: true });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Tạo dự án", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tiếp tục", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Tên dự án", { exact: true }).fill("Công việc");
  await page.getByRole("button", { name: "Chọn thư mục", exact: true }).click();
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page.getByText("03.01.001", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Loại tài liệu", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await page
    .getByRole("button", { name: "Hoàn tất thiết lập", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sẵn sàng cho công việc mới" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Thư mục mới", exact: true }).click();
  await page
    .getByLabel("Tên thư mục", { exact: true })
    .fill("Hồ sơ thanh toán");
  await expect(
    page.getByText("01 Ho_so_thanh_toan", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tạo thư mục", exact: true }).click();
  await page.getByRole("listbox").getByRole("option").click();
  await expect(page.getByRole("listbox").getByRole("option")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page
    .getByRole("listbox")
    .getByRole("option")
    .click({ button: "right" });
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(page.getByRole("listbox")).toBeFocused();
  await page.keyboard.press("F2");
  await expect(
    page.getByRole("dialog", { name: "Chuẩn hóa và phân loại" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Sửa tên hoặc mã trước khi chuẩn hóa"),
  ).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.setViewportSize({ width: 900, height: 640 });
  expect(
    await page.locator("body").evaluate((el) => el.scrollWidth),
  ).toBeLessThanOrEqual(900);
  await expect(
    page.getByRole("button", { name: "Mới", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1380, height: 900 });
  if (process.env.HFOLDER_SCREENSHOTS) {
    await page.screenshot({
      path: `${process.env.HFOLDER_SCREENSHOTS}/HFolder-workspace.png`,
    });
    await page
      .getByRole("button", { name: "Cài đặt", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "Tối", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Đóng", exact: true })
      .click();
    await page.screenshot({
      path: `${process.env.HFOLDER_SCREENSHOTS}/HFolder-workspace-dark.png`,
    });
  }
});
