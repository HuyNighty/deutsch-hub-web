import { test, expect } from "@playwright/test";
import { returningFixtures } from "../src/interaction-fixtures.js";

test.beforeEach(async ({ page }) => {
  page.researchErrors = [];
  page.researchRequests = [];
  page.on("pageerror", (error) => page.researchErrors.push(error.message));
  page.on("request", (request) => page.researchRequests.push({ method: request.method(), url: request.url() }));
  await page.goto("/interaction.html");
  await page.getByRole("combobox", { name: "Chế độ", exact: true }).selectOption("returning");
});
test.afterEach(async ({ page }, info) => {
  await info.attach("network", { body: JSON.stringify(page.researchRequests), contentType: "application/json" });
  expect(page.researchErrors).toEqual([]);
  expect(page.researchRequests.every(({ method, url }) => method === "GET" && new URL(url).origin === "http://127.0.0.1:5180" && /^\/(interaction\.html|assets\/)/.test(new URL(url).pathname))).toBe(true);
  await expect(page).toHaveURL("http://127.0.0.1:5180/interaction.html");
});

for (const model of ["A", "B"]) {
  for (const scenario of ["R1", "R2", "R3"]) {
    test(`${model}/${scenario}: canonical direction and next-activity destination identities`, async ({ page }) => {
      await page.getByRole("combobox", { name: "Tình huống quay lại" }).selectOption(scenario);
      await page.getByRole("radio", { name: `Mẫu ${model}` }).check();
      const fixture = returningFixtures[scenario];
      const panelFill = await page.getByTestId("interaction-panel").evaluate((element) => getComputedStyle(element).backgroundColor);
      expect(panelFill).toBe(model === "A" ? "rgb(250, 250, 247)" : "rgb(234, 230, 213)");
      if (scenario === "R1") {
        await expect(page.getByText("3 / 8 bài học")).toBeVisible();
        await expect(page.getByText("37.5%")).toBeVisible();
        await page.getByRole("button", { name: "Tiếp tục học", exact: true }).click();
        await expect(page.getByTestId("research-destination")).toHaveAttribute("data-kind", "course");
        await expect(page.getByTestId("research-destination")).toHaveAttribute("data-course-id", fixture.direction.target.courseId);
        await expect(page.getByTestId("research-destination")).not.toHaveAttribute("data-lesson-id");
        await page.getByRole("button", { name: "Quay lại tình huống" }).click();
        await page.getByRole("button", { name: "Mở bài học tiếp theo" }).click();
        await expect(page.getByTestId("research-destination")).toHaveAttribute("data-kind", "lesson");
      } else if (scenario === "R2") {
        await expect(page.getByText("Bài đánh giá và bài tập đang thực hiện; chưa có kết quả chính thức.")).toBeVisible();
        await page.getByRole("button", { name: "Tiếp tục đánh giá" }).click();
        await expect(page.getByTestId("research-destination")).toHaveAttribute("data-kind", "assessment");
        await expect(page.getByTestId("research-destination")).toHaveAttribute("data-assessment-attempt-id", fixture.direction.target.assessmentAttemptId);
        await expect(page.getByTestId("research-destination")).not.toHaveAttribute("data-task-id");
        await page.getByRole("button", { name: "Quay lại tình huống" }).click();
        await page.getByRole("button", { name: "Tiếp tục bài tập" }).click();
        await expect(page.getByTestId("research-destination")).toHaveAttribute("data-kind", "task");
      } else {
        await expect(page.getByRole("heading", { name: "Một điểm bắt đầu mới" })).toBeVisible();
        await expect(page.getByRole("alert")).toHaveCount(0);
        await expect(page.getByTestId("interaction-specimen")).not.toContainText(/lỗi|thất bại|error|failed/i);
        await page.getByRole("button", { name: "Khám phá khóa học" }).click();
        await expect(page.getByTestId("research-destination")).toHaveAttribute("data-kind", "catalog");
      }
      const destination = page.getByTestId("research-destination");
      for (const [field, attribute] of [["courseId", "data-course-id"], ["lessonId", "data-lesson-id"], ["assessmentAttemptId", "data-assessment-attempt-id"], ["taskId", "data-task-id"], ["quizAttemptId", "data-quiz-attempt-id"]]) {
        if (fixture.nextActivity.target?.[field]) await expect(destination).toHaveAttribute(attribute, fixture.nextActivity.target[field]);
        else await expect(destination).not.toHaveAttribute(attribute);
      }
      await page.getByRole("radio", { name: `Mẫu ${model === "A" ? "B" : "A"}` }).check();
      await expect(destination).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Học tập của tôi", exact: true })).toBeVisible();
    });
  }
}

test("Returning Study keeps its visual context fixed across R1–R3", async ({ page }) => {
  for (const scenario of ["R1", "R2", "R3"]) {
    await page.getByRole("combobox", { name: "Tình huống quay lại" }).selectOption(scenario);
    expect(await page.getByTestId("interaction-specimen").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(245, 239, 227)");
    expect(await page.getByTestId("interaction-panel").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(250, 250, 247)");
    await expect(page.getByRole("radio", { name: "Mẫu A" })).toBeChecked();
  }
});
