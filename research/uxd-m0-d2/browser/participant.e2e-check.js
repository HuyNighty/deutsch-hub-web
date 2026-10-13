import { test, expect, chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { assessmentFixture, returningFixtures } from "../src/interaction-fixtures.js";
import { surfaces } from "../src/surfaces.js";

const optionB = assessmentFixture.runtime.questions[0].options[1].content;
async function begin(page, { study = "assessment", model = "A", caseId = "draft", context = "publicHome", returning = "R1", interval = "1000" } = {}) {
  await page.goto("/participant.html");
  await page.getByRole("combobox", { name: "Nghiên cứu", exact: true }).selectOption(study);
  await page.getByRole("combobox", { name: "Mẫu", exact: true }).selectOption(model);
  if (study === "surface") await page.getByRole("combobox", { name: "Bối cảnh", exact: true }).selectOption(context);
  if (study === "returning") await page.getByRole("combobox", { name: "Tình huống quay lại", exact: true }).selectOption(returning);
  if (study === "assessment") {
    await page.getByRole("combobox", { name: "Tình huống đánh giá", exact: true }).selectOption(caseId);
    if (caseId.startsWith("live")) await page.getByLabel("Khoảng chờ hiệu chỉnh (ms)").fill(interval);
  }
  await page.getByRole("button", { name: "Chuẩn bị bàn giao", exact: true }).click();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Bắt đầu tình huống", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("note", { name: "Thông tin nghiên cứu" })).toBeFocused();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.getByText(/Mẫu A|Mẫu B|S1 —|S2 —|S3 —|R1 —|R2 —|R3 —/)).toHaveCount(0);
}
async function audit(page, info, label) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  await info.attach("axe-" + label, { body: JSON.stringify(result), contentType: "application/json" });
  expect(result.violations).toEqual([]);
}
async function visibleFocus(target) {
  await expect(target).toBeFocused();
  const geometry = await target.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: innerWidth, height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth, outline: getComputedStyle(element).outlineWidth };
  });
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);
  expect(geometry.x).toBeGreaterThanOrEqual(0);
  expect(geometry.y).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.width);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.height);
  expect(geometry.outline).toBe("3px");
  return geometry;
}
test.beforeEach(async ({ page }) => {
  page.participantErrors = [];
  page.participantRequests = [];
  page.on("pageerror", (error) => page.participantErrors.push(error.message));
  page.on("request", (request) => page.participantRequests.push({ method: request.method(), url: request.url() }));
});
test.afterEach(async ({ page }, info) => {
  expect(page.participantErrors).toEqual([]);
  expect(page.participantRequests.every(({ method, url }) => method === "GET" && new URL(url).origin === "http://127.0.0.1:5180" && /^\/(participant\.html|index\.html|assets\/)/.test(new URL(url).pathname))).toBe(true);
  await info.attach("requests", { body: JSON.stringify(page.participantRequests), contentType: "application/json" });
});

for (const model of ["A", "B"]) {
  for (const outcome of ["Confirmed", "Error", "Uncertain", "Submit"]) {
    test(model + ": live " + outcome + ", real keyboard, one operation and stable announcements", async ({ page }, info) => {
      await begin(page, { model, caseId: "live" + outcome });
      await page.keyboard.press("Tab");
      await visibleFocus(page.getByRole("checkbox").nth(0));
      await page.keyboard.press("Tab");
      const b = page.getByRole("checkbox").nth(1);
      await visibleFocus(b);
      if (outcome !== "Submit") {
        await expect(b).not.toBeChecked();
        await page.keyboard.press("Space");
        await expect(b).toBeChecked();
        await expect(page.getByTestId("saved-selection")).not.toContainText(optionB);
        await expect(page.getByTestId("draft-selection")).toContainText(optionB);
      }
      await page.keyboard.press("Tab");
      const cue = page.getByRole("button", { name: "Chạy tình huống mô phỏng", exact: true });
      await visibleFocus(cue);
      await expect(cue).toHaveAttribute("aria-disabled", "false");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("operation-status")).toContainText("Đang chờ");
      await expect(page.getByRole("group", { name: /Câu hỏi/ })).toHaveAttribute("aria-busy", "true");
      await expect(cue).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(cue).toHaveAttribute("aria-disabled", "true");
      const message = outcome === "Error" ? page.getByTestId("operation-error") : page.getByTestId("operation-status");
      await expect(message).toContainText({ Confirmed: "xác nhận lựa chọn", Error: "lỗi xác định", Uncertain: "Kết quả chưa xác định", Submit: "xác nhận nộp bài tập" }[outcome]);
      if (outcome === "Confirmed") await expect(page.getByTestId("saved-selection")).toContainText(optionB);
      else await expect(page.getByTestId("saved-selection")).not.toContainText(optionB);
      await expect(page.getByTestId("task-status")).toContainText(outcome === "Submit" ? "Đã nộp" : "Đang thực hiện");
      await expect(page.getByTestId("assessment-status")).toContainText("Đang thực hiện");
      await expect(page.getByTestId("official-result")).toContainText("Chưa có");
      if (outcome === "Uncertain") await expect(b).toBeDisabled();
      await audit(page, info, "live-outcome");
    });
  }
  for (const caseId of ["draft", "pending", "confirmed", "error", "uncertain", "submitted"]) {
    test(model + ": accessible snapshot " + caseId, async ({ page }, info) => {
      await begin(page, { model, caseId });
      await expect(page.getByRole("group", { name: /Câu hỏi/ })).toHaveAccessibleDescription(assessmentFixture.runtime.questions[0].content);
      await expect(page.getByRole("checkbox").nth(1)).toHaveAccessibleName(optionB);
      await expect(page.getByRole("button", { name: "Chạy tình huống mô phỏng", exact: true })).toHaveCount(0);
      if (caseId !== "draft") await expect(page.getByRole("checkbox").nth(0)).toBeDisabled();
      await expect(page.getByTestId("saved-selection")).toContainText(assessmentFixture.runtime.questions[0].options[0].content);
      if (caseId === "confirmed") await expect(page.getByTestId("saved-selection")).toContainText(optionB);
      else await expect(page.getByTestId("saved-selection")).not.toContainText(optionB);
      await audit(page, info, caseId);
    });
  }
  for (const [returning, label, kind, field] of [
    ["R1", "Tiếp tục học", "course", "direction"],
    ["R1", "Mở bài học tiếp theo", "lesson", "nextActivity"],
    ["R2", "Tiếp tục đánh giá", "assessment", "direction"],
    ["R2", "Tiếp tục bài tập", "task", "nextActivity"],
    ["R3", "Khám phá khóa học", "catalog", "nextActivity"],
  ]) {
    test(model + ": " + returning + "/" + kind + " keyboard destination and Back focus", async ({ page }, info) => {
      await begin(page, { study: "returning", model, returning });
      await audit(page, info, "returning");
      const trigger = page.getByRole("button", { name: label, exact: true });
      for (let count = 0; count < 3 && !(await trigger.evaluate((element) => element === document.activeElement)); count++) await page.keyboard.press("Tab");
      await visibleFocus(trigger);
      await page.keyboard.press("Enter");
      const destination = page.getByTestId("research-destination");
      await expect(destination).toHaveAttribute("data-kind", kind);
      const target = returningFixtures[returning][field].target;
      for (const [key, attribute] of [["courseId", "data-course-id"], ["lessonId", "data-lesson-id"], ["assessmentAttemptId", "data-assessment-attempt-id"], ["taskId", "data-task-id"], ["quizAttemptId", "data-quiz-attempt-id"]]) {
        if (target?.[key]) await expect(destination).toHaveAttribute(attribute, target[key]);
        else await expect(destination).not.toHaveAttribute(attribute);
      }
      await visibleFocus(page.getByRole("heading", { level: 1 }));
      await audit(page, info, "destination");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Quay lại tình huống", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      await visibleFocus(trigger);
      expect(await page.getByTestId("interaction-specimen").evaluate((main) => main.style.getPropertyValue("--research-reading-fill"))).toBe(surfaces.myLearning[model]);
    });
  }
}

async function panelSnapshot(page) {
  return page.locator("main article").evaluate((panel) => {
    const origin = panel.getBoundingClientRect();
    return [panel, ...panel.querySelectorAll("*")].map((element) => {
      const rect = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      return { tag: element.tagName, text: element.textContent, checked: element.checked, disabled: element.disabled,
        role: element.getAttribute("role"), description: element.getAttribute("aria-describedby"),
        rect: [rect.x - origin.x, rect.y - origin.y, rect.width, rect.height], font: css.font,
        color: css.color, border: css.border, padding: css.padding, background: element === panel ? "reading-fill" : css.backgroundColor };
    });
  });
}
for (const width of [1440, 375, 320]) {
  for (const context of Object.keys(surfaces)) {
    test(width + "px: original static specimen fidelity and paired surfaces " + context, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      const samples = [];
      for (const model of ["A", "B"]) {
        await page.goto("/index.html");
        await page.getByRole("combobox", { name: "Bối cảnh", exact: true }).selectOption(context);
        await page.getByRole("radio", { name: "Mẫu " + model }).check();
        const original = await panelSnapshot(page);
        await begin(page, { study: "surface", model, context });
        const participant = await panelSnapshot(page);
        expect(participant).toEqual(original);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await audit(page, info, "static-" + model);
        samples.push(participant);
      }
      expect(samples[0]).toEqual(samples[1]);
      await info.attach("paired-static-panels", { body: JSON.stringify(samples), contentType: "application/json" });
    });
  }
  for (const mode of ["assessment", "R1", "R2", "R3"]) {
    test(width + "px: participant A/B geometry and visible keyboard focus " + mode, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      const samples = [];
      for (const model of ["A", "B"]) {
        await begin(page, { study: mode === "assessment" ? "assessment" : "returning", model, returning: mode === "assessment" ? "R1" : mode });
        samples.push(await panelSnapshot(page));
        await page.keyboard.press("Tab");
        const target = mode === "assessment" ? page.getByRole("checkbox").nth(0) : page.locator("main").getByRole("button").first();
        await visibleFocus(target);
        if (mode === "assessment") {
          await page.keyboard.press("Tab");
          await page.keyboard.press("Space");
          await expect(page.getByRole("checkbox").nth(1)).toBeChecked();
          await expect(page.getByTestId("saved-selection")).not.toContainText(optionB);
        } else {
          await page.keyboard.press("Enter");
          await visibleFocus(page.getByRole("heading", { level: 1 }));
          await page.keyboard.press("Tab");
          await page.keyboard.press("Enter");
          await visibleFocus(target);
        }
      }
      expect(samples[0]).toEqual(samples[1]);
      await info.attach("paired-participant-panels", { body: JSON.stringify(samples), contentType: "application/json" });
    });
  }
}

test("pause cancels a live operation; explicit handoff starts a clean task", async ({ page }) => {
  await begin(page, { caseId: "liveConfirmed", interval: "1000" });
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Chạy tình huống mô phỏng", exact: true }).click();
  await expect(page.getByTestId("operation-status")).toContainText("Đang chờ");
  await page.getByRole("button", { name: "Tạm dừng và bàn giao", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tạm dừng nghiên cứu" })).toBeFocused();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page.getByRole("button", { name: "Bàn giao cho người điều phối", exact: true }).click();
  await expect(page.getByLabel("Khoảng chờ hiệu chỉnh (ms)")).toHaveValue("1000");
  await page.getByRole("button", { name: "Chuẩn bị bàn giao", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu tình huống", exact: true }).click();
  // Cross the old operation deadline; it must not settle this new task.
  await page.waitForTimeout(1100);
  await expect(page.getByTestId("operation-status")).toContainText("Chưa bắt đầu");
  await expect(page.getByTestId("saved-selection")).not.toContainText(optionB);
});
test("participant reduced-motion preference has no layout animation", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await begin(page);
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  expect(await page.locator("#participant-root *").evaluateAll((elements) => elements.filter((element) => {
    const css = getComputedStyle(element);
    return css.animationName !== "none" || css.transitionDuration.split(",").some((value) => parseFloat(value) !== 0);
  }).map((element) => element.tagName))).toEqual([]);
  await info.attach("manual-AT-boundary", { body: "NOT RUN: no screen-reader session; computed semantics are not spoken acceptance.", contentType: "text/plain" });
});
test("private setup calibration, neutral ready and explicit pause remain accessible", async ({ page }, info) => {
  await page.goto("/participant.html");
  await page.getByRole("combobox", { name: "Nghiên cứu", exact: true }).selectOption("assessment");
  await page.getByRole("combobox", { name: "Tình huống đánh giá", exact: true }).selectOption("liveConfirmed");
  const interval = page.getByRole("spinbutton", { name: "Khoảng chờ hiệu chỉnh (ms)" });
  await expect(interval).toHaveValue("");
  await page.getByRole("button", { name: "Chuẩn bị bàn giao", exact: true }).click();
  await expect(interval).toBeFocused();
  expect(await interval.evaluate((element) => element.validity.valueMissing)).toBe(true);
  await interval.fill("1000");
  await audit(page, info, "private-setup");
  await page.getByRole("button", { name: "Chuẩn bị bàn giao", exact: true }).click();
  await audit(page, info, "neutral-ready");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Tạm dừng và bàn giao", exact: true }).click();
  await visibleFocus(page.getByRole("heading", { name: "Tạm dừng nghiên cứu" }));
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await audit(page, info, "neutral-pause");
});
for (const model of ["A", "B"]) {
  for (const setting of ["zoom", "text"]) {
    test(model + ": participant native 200% " + setting, async ({ browserName }, info) => {
      expect(browserName).toBe("chromium");
      const samples = [];
      for (const enlarged of [false, true]) {
        const zoom = enlarged && setting === "zoom" ? 2 : 1;
        const font = enlarged && setting === "text" ? 32 : 16;
        const profile = info.outputPath(enlarged ? "enlarged-profile" : "control-profile");
        await fs.mkdir(path.join(profile, "Default"), { recursive: true });
        await fs.writeFile(path.join(profile, "Default/Preferences"), JSON.stringify({
          partition: { default_zoom_level: { x: Math.log(zoom) / Math.log(1.2) } },
          webkit: { webprefs: { default_font_size: font, default_fixed_font_size: font } },
        }), { flag: "wx" });
        const session = await chromium.launchPersistentContext(profile, { channel: "chromium", headless: true, viewport: null, baseURL: "http://127.0.0.1:5180", args: ["--window-size=1280,900"] });
        try {
          const page = await session.newPage();
          const errors = [];
          const requests = [];
          page.on("pageerror", (error) => errors.push(error.message));
          page.on("request", (request) => requests.push({ method: request.method(), url: request.url() }));
          const tasks = [
            ...Object.keys(surfaces).map((context) => ({ study: "surface", context })),
            { study: "assessment" },
            ...["R1", "R2", "R3"].map((returning) => ({ study: "returning", returning })),
          ];
          for (const task of tasks) {
            await begin(page, { model, ...task });
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await page.keyboard.press("Tab");
            const target = task.study === "surface" ? page.getByRole("button", { name: "Tạm dừng và bàn giao", exact: true })
              : task.study === "assessment" ? page.getByRole("checkbox").first() : page.locator("main").getByRole("button").first();
            await visibleFocus(target);
            if (task.study === "surface") {
              await page.keyboard.press("Enter");
              await visibleFocus(page.getByRole("heading", { name: "Tạm dừng nghiên cứu" }));
            } else if (task.study === "assessment") {
              await page.keyboard.press("Tab");
              await page.keyboard.press("Space");
              await expect(page.getByRole("checkbox").nth(1)).toBeChecked();
              await expect(page.getByTestId("saved-selection")).not.toContainText(optionB);
            } else {
              await page.keyboard.press("Enter");
              await visibleFocus(page.getByRole("heading", { level: 1 }));
              await page.keyboard.press("Tab");
              await page.keyboard.press("Enter");
              await visibleFocus(target);
            }
          }
          const metrics = await page.evaluate(() => ({ width: innerWidth, outerWidth, dpr: devicePixelRatio, scale: visualViewport.scale,
            rootFont: getComputedStyle(document.documentElement).fontSize, harnessFont: getComputedStyle(document.querySelector("#participant-root > div")).fontSize }));
          expect(metrics.rootFont).toBe(font + "px");
          expect(metrics.harnessFont).toBe(font + "px");
          expect(metrics.scale).toBe(1);
          expect(errors).toEqual([]);
          expect(requests.every(({ method, url }) => method === "GET" && new URL(url).origin === "http://127.0.0.1:5180" && /^\/(participant\.html|assets\/)/.test(new URL(url).pathname))).toBe(true);
          samples.push({ enlarged, metrics, requests });
        } finally { await session.close(); }
      }
      if (setting === "zoom") {
        expect(samples[1].metrics.dpr / samples[0].metrics.dpr).toBe(2);
        expect(samples[1].metrics.width * 2).toBeCloseTo(samples[0].metrics.width, 0);
        expect(samples[1].metrics.outerWidth).toBe(samples[0].metrics.outerWidth);
      } else {
        expect(samples[1].metrics.dpr).toBe(samples[0].metrics.dpr);
        expect(samples[1].metrics.width).toBe(samples[0].metrics.width);
      }
      await info.attach("participant-native-enlargement", { body: JSON.stringify(samples), contentType: "application/json" });
    });
  }
}
