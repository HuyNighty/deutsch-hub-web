import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.researchErrors = [];
  page.researchRequests = [];
  page.on("pageerror", (error) => page.researchErrors.push(error.message));
  page.on("request", (request) => page.researchRequests.push({ method: request.method(), url: request.url() }));
  await page.goto("/interaction.html");
});
test.afterEach(async ({ page }, info) => {
  await info.attach("network", { body: JSON.stringify(page.researchRequests), contentType: "application/json" });
  expect(page.researchErrors).toEqual([]);
  expect(page.researchRequests.every(({ method, url }) => method === "GET" && new URL(url).origin === "http://127.0.0.1:5180" && /^\/(interaction\.html|assets\/)/.test(new URL(url).pathname))).toBe(true);
});

for (const model of ["A", "B"]) {
  test(`${model}: Tab and Shift+Tab change focus; Space changes only the draft`, async ({ page }) => {
    await page.getByRole("radio", { name: `Mẫu ${model}` }).check();
    await page.getByRole("button", { name: "Đặt lại nghiên cứu" }).click();
    const options = page.getByRole("checkbox");
    await page.keyboard.press("Tab");
    await expect(options.nth(0)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(options.nth(1)).toBeFocused();
    await expect(options.nth(1)).not.toBeChecked();
    await expect(page.getByTestId("saved-selection")).toHaveText("A");
    await expect(page.getByTestId("draft-selection")).toHaveText("A");
    expect(await options.nth(1).evaluate((element) => getComputedStyle(element).outlineWidth)).toBe("3px");
    await page.keyboard.press("Space");
    await expect(options.nth(1)).toBeChecked();
    await expect(page.getByTestId("draft-selection")).toHaveText("A, B");
    await expect(page.getByTestId("saved-selection")).toHaveText("A");
    await page.keyboard.press("Shift+Tab");
    await expect(options.nth(0)).toBeFocused();
    await expect(options.nth(0)).toBeChecked();
    await expect(options.nth(1)).toBeChecked();
  });

  for (const outcome of ["confirmed", "error", "uncertain"]) {
    test(`${model}: frozen operation, duplicate guard and ${outcome} outcome`, async ({ page }) => {
      await page.getByRole("radio", { name: `Mẫu ${model}` }).check();
      await page.getByRole("checkbox").nth(1).check();
      await page.getByRole("button", { name: "Bắt đầu mô phỏng lưu", exact: true }).click();
      await expect(page.getByTestId("operation-status")).toContainText("Đang chờ");
      await expect(page.getByTestId("saved-selection")).toHaveText("A");
      await expect(page.getByTestId("draft-selection")).toHaveText("A, B");
      await expect(page.getByTestId("operation-count")).toHaveText("1");
      await expect(page.getByRole("checkbox").nth(1)).toBeDisabled();
      await expect(page.getByRole("button", { name: "Bắt đầu mô phỏng lưu", exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Bắt đầu mô phỏng nộp bài tập" })).toBeDisabled();
      const label = { confirmed: "Xác nhận kịch bản", error: "Lỗi xác định", uncertain: "Kết quả chưa xác định" }[outcome];
      await page.getByRole("button", { name: label, exact: true }).click();
      await expect(page.getByTestId("saved-selection")).toHaveText(outcome === "confirmed" ? "A, B" : "A");
      await expect(page.getByTestId("operation-status")).toContainText({ confirmed: "Đã xác nhận trong mô phỏng", error: "lỗi xác định", uncertain: "Chưa thể kết luận" }[outcome]);
      if (outcome === "uncertain") {
        await expect(page.getByRole("button", { name: "Xác nhận kịch bản" })).toBeDisabled();
        await expect(page.getByRole("button", { name: "Bắt đầu mô phỏng lưu", exact: true })).toBeDisabled();
        await expect(page.getByRole("checkbox").nth(1)).toBeDisabled();
        // Observing a later browser frame does not trigger a new operation.
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect(page.getByTestId("operation-count")).toHaveText("1");
      }
      await expect(page.getByTestId("assessment-status")).toHaveText("Bài đánh giá: Đang thực hiện");
      await expect(page.getByTestId("official-result")).toHaveText("Chưa có kết quả chính thức.");
      await expect(page.getByTestId("interaction-specimen").getByRole("button")).toHaveCount(0);
    });
  }

  test(`${model}: reset restores A and invalidates a stale scripted confirmation`, async ({ page }) => {
    await page.getByRole("radio", { name: `Mẫu ${model}` }).check();
    await page.getByRole("checkbox").nth(1).check();
    await page.getByRole("button", { name: "Bắt đầu mô phỏng lưu", exact: true }).click();
    await page.getByRole("button", { name: "Đặt lại nghiên cứu" }).click();
    await page.getByRole("button", { name: "Gửi lại xác nhận cũ" }).click();
    await expect(page.getByText(/Đã bỏ qua xác nhận ngoài khối: 1/)).toBeVisible();
    await expect(page.getByTestId("saved-selection")).toHaveText("A");
    await expect(page.getByTestId("draft-selection")).toHaveText("A");
    await expect(page.getByTestId("operation-count")).toHaveText("0");
    await expect(page.getByRole("checkbox").nth(1)).not.toBeChecked();
  });

  test(`${model}: scripted Task submission leaves the parent active and official Result absent`, async ({ page }) => {
    await page.getByRole("radio", { name: `Mẫu ${model}` }).check();
    await page.getByRole("button", { name: "Bắt đầu mô phỏng nộp bài tập" }).click();
    await expect(page.getByTestId("task-status")).toContainText("Đang thực hiện");
    await page.getByRole("button", { name: "Xác nhận kịch bản" }).click();
    await expect(page.getByTestId("task-status")).toContainText("Đã nộp");
    await expect(page.getByTestId("assessment-status")).toHaveText("Bài đánh giá: Đang thực hiện");
    await expect(page.getByTestId("official-result")).toHaveText("Chưa có kết quả chính thức.");
    await expect(page.getByRole("checkbox").nth(0)).toBeDisabled();
    await expect(page.getByRole("button", { name: "Bắt đầu mô phỏng nộp bài tập" })).toBeDisabled();
    await expect(page.getByTestId("interaction-specimen")).not.toContainText(/correct|incorrect|passed|đáp án đúng|đáp án sai/i);
  });
}

test("switching model resets the block; both models have identical rendered state and geometry", async ({ page }) => {
  const capture = () => page.getByTestId("interaction-panel").evaluate((panel) => [...panel.querySelectorAll("*")].map((element) => {
    const rect = element.getBoundingClientRect();
    const css = getComputedStyle(element);
    return { tag: element.tagName, text: element.textContent, checked: element.checked, disabled: element.disabled, rect: [rect.x, rect.y, rect.width, rect.height], font: css.font, color: css.color, background: css.backgroundColor, border: css.border, outline: css.outline };
  }));
  const initialA = await capture();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Bắt đầu mô phỏng lưu", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận kịch bản" }).click();
  await expect(page.getByTestId("saved-selection")).toHaveText("A, B");
  await page.getByRole("radio", { name: "Mẫu B" }).check();
  await expect(page.getByTestId("saved-selection")).toHaveText("A");
  await expect(page.getByTestId("operation-count")).toHaveText("0");
  expect(await capture()).toEqual(initialA);
});
