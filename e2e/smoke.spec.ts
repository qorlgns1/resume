import fs from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";
import {
  ApiErrorResponseSchema,
  PublicPageResponseSchema,
  type SystemPageKey,
} from "@resume/contracts";
import { ports, testAdmin } from "../playwright.config";
import { gpsPhoto, imageInfo } from "./fixtures";

const web = `http://localhost:${ports.web}`;
const admin = `http://localhost:${ports.admin}`;
const screens = "test-results/screens";

async function expectNoHorizontalScroll(page: Page) {
  const [scrollWidth, innerWidth] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    window.innerWidth,
  ]);
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

test.describe("공개 콘텐츠 API (DB 게시본)", () => {
  for (const key of ["home", "projects", "experience", "history"] satisfies SystemPageKey[]) {
    test(`${key} 응답이 계약을 만족한다`, async ({ request }) => {
      const res = await request.get(`${admin}/api/public/v1/pages/${key}`);
      expect(res.status()).toBe(200);
      expect(res.headers()["cache-control"]).toContain("no-store");
      const body = PublicPageResponseSchema.parse(await res.json());
      // 첫 실행 시 샘플 콘텐츠가 게시 버전 1로 저장된다.
      expect(body.meta.source).toBe("published");
      expect(body.meta.version).toBe(1);
    });
  }

  test("없는 페이지는 404와 오류 계약으로 응답한다", async ({ request }) => {
    const res = await request.get(`${admin}/api/public/v1/pages/unknown`);
    expect(res.status()).toBe(404);
    ApiErrorResponseSchema.parse(await res.json());
  });
});

test.describe("공개 사이트 홈", () => {
  for (const width of [1440, 390]) {
    test(`${width}px 화면`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const res = await page.goto(web);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("아이디어를 제품으로");
      await expect(page.getByRole("note")).toContainText("샘플 데이터");
      await expect(page.locator('[data-module-id="mod_home_projects"] article')).toHaveCount(3);
      await expectNoHorizontalScroll(page);
      await page.screenshot({ path: `${screens}/home-${width}.png`, fullPage: true });
    });
  }

  test("메뉴 링크가 모두 열린다", async ({ page, request }) => {
    await page.goto(web);
    for (const path of ["/", "/projects", "/experience", "/history"]) {
      expect((await request.get(`${web}${path}`)).status(), path).toBe(200);
    }
  });
});

test.describe("햄버거 메뉴", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("키보드로 열고, 포커스를 가두고, Escape로 닫으면 트리거로 포커스가 돌아온다", async ({
    page,
  }) => {
    await page.goto(web);
    // 메뉴가 열리면 Radix가 바깥 요소를 접근성 트리에서 숨기므로 속성으로 찾는다.
    const trigger = page.locator('button[aria-label="메뉴 열기"]');
    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: "메뉴" });
    await expect(dialog).toBeVisible();
    await dialog.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(dialog.getByRole("link", { name: "홈" })).toHaveAttribute("aria-current", "page");

    // 배경 스크롤 잠금
    const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflow).toBe("hidden");

    // Tab을 여러 번 눌러도 포커스는 메뉴 안에 머문다
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await page.screenshot({ path: `${screens}/menu-390.png` });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
  });

  test("메뉴 항목은 고유 URL로 이동한다", async ({ page }) => {
    await page.goto(web);
    await page.getByRole("button", { name: "메뉴 열기" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "회사 경험" }).click();
    await expect(page).toHaveURL(`${web}/experience`);
    await expect(page.getByRole("heading", { level: 1, name: "회사 경험" })).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("reduced-motion에서는 애니메이션이 사실상 꺼진다", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(web);
    await page.getByRole("button", { name: "메뉴 열기" }).click();
    const duration = await page
      .getByRole("dialog")
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).animationDuration));
    expect(duration).toBeLessThan(0.01);
  });
});

test.describe("목록·상세·히스토리 페이지", () => {
  test("개인 프로젝트 목록에서 상세로 이동하고 돌아온다", async ({ page }) => {
    await page.goto(`${web}/projects`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("개인 프로젝트");
    await expect(page.locator("main article")).toHaveCount(3);
    await page.getByRole("link", { name: "타임카드 자세히 보기" }).click();
    await expect(page).toHaveURL(`${web}/projects/timecard`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("타임카드");
    await expect(page.getByRole("heading", { level: 2, name: "만든 것" })).toBeVisible();
    // 중첩 목록: 상위 2개, 하위 2개
    await expect(page.locator("main ul ul > li")).toHaveCount(2);
    await page.screenshot({ path: `${screens}/project-detail-1440.png`, fullPage: true });
    await page.getByRole("link", { name: "← 개인 프로젝트" }).click();
    await expect(page).toHaveURL(`${web}/projects`);
  });

  test("없는 상세 주소는 404를 돌려준다", async ({ request }) => {
    expect((await request.get(`${web}/projects/does-not-exist`)).status()).toBe(404);
    expect((await request.get(`${web}/experience/does-not-exist`)).status()).toBe(404);
  });

  test("회사 경험 상세에 본문과 관련 성과가 보인다", async ({ page }) => {
    await page.goto(`${web}/experience`);
    await page.getByRole("link", { name: "샘플 회사 C 자세히 보기" }).click();
    await expect(page).toHaveURL(`${web}/experience/company-c`);
    await expect(page.getByRole("heading", { level: 2, name: "맡은 일" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "이 회사에서의 성과" })).toBeVisible();
  });

  test("히스토리의 챕터와 연결 링크가 모두 열린다", async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${web}/history`);
    await expect(page.locator("main section")).toHaveCount(2);
    await expectNoHorizontalScroll(page);
    await page.screenshot({ path: `${screens}/history-390.png`, fullPage: true });
    const hrefs = await page
      .locator("main section a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect((await request.get(`${web}${href}`)).status(), href ?? "").toBe(200);
    }
  });

  test("홈의 프로젝트 카드에서 상세로 이동한다", async ({ page }) => {
    await page.goto(web);
    await page
      .locator('[data-module-id="mod_home_projects"]')
      .getByRole("link", { name: "책갈피 자세히 보기" })
      .click();
    await expect(page).toHaveURL(`${web}/projects/bookmark`);
  });
});

test.describe("콘텐츠 출처 모드", () => {
  test("API 모드는 어드민 API에서 읽어 렌더링한다", async ({ page }) => {
    await page.goto(`http://localhost:${ports.webApi}/`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("아이디어를 제품으로");
  });

  test("API 연결이 실패하면 샘플로 대체하지 않고 오류를 보여준다", async ({ page }) => {
    await page.goto(`http://localhost:${ports.webApiDown}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "콘텐츠 서버에 연결할 수 없습니다",
    );
    await expect(page.locator("[data-error-kind]")).toHaveAttribute("data-error-kind", "network");
    await expect(page.getByText("아이디어를 제품으로")).toHaveCount(0);
  });
});

test.describe("어드민", () => {
  // 로그인 시도 제한(1분에 5번)을 넘지 않도록 한 페이지에서 순서대로 진행한다.
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1440, height: 900 } });

  let page: Page;
  let unusedAssetId = "";
  let usedAssetId = "";
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  });
  test.afterAll(async () => {
    await page.close();
  });

  test("로그인하지 않으면 로그인 화면으로 보낸다", async ({ request }) => {
    await page.goto(admin);
    await expect(page).toHaveURL(`${admin}/login`);
    // 웹 가입 경로는 닫혀 있다
    const signUp = await request.post(`${admin}/api/auth/sign-up/email`, {
      headers: { origin: admin },
      data: { email: "x@example.com", password: "aaaaaaaaaaaa", name: "x" },
    });
    expect(signUp.status()).toBe(404);
  });

  test("비밀번호가 틀리면 오류를 보여주고, 맞으면 편집 화면으로 들어간다", async () => {
    await page.getByLabel("아이디").fill(testAdmin.username);
    await page.getByLabel("비밀번호").fill("wrong-password");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.locator("[data-slot=field-error]")).toHaveText(
      "아이디 또는 비밀번호가 올바르지 않습니다.",
    );
    await page.screenshot({ path: `${screens}/admin-login-error.png` });

    await page.getByLabel("비밀번호").fill(testAdmin.password);
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL(`${admin}/`);
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
    const cookie = (await page.context().cookies()).find((c) => c.name.endsWith("session_token"));
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
  });

  test("페이지·모듈 선택과 미리보기 전환 (DB 초안)", async () => {
    const settings = page.getByRole("complementary", { name: "설정" });
    await expect(settings).toContainText("모듈이나 콘텐츠를 선택하세요");
    await expect(page.getByTestId("draft-status")).toHaveText("게시됨 · 버전 1");

    await page.getByRole("button", { name: "성과 모듈 선택" }).click();
    await expect(settings.getByRole("heading", { level: 2 })).toHaveText("성과");
    await expect(settings).toContainText("mod_home_achievements");

    const sidebar = page.getByRole("complementary", { name: "페이지와 콘텐츠" });
    await expect(sidebar.locator("button[aria-pressed=true]")).toHaveText(/^성과/);
    await page.screenshot({ path: `${screens}/admin-desktop.png` });

    await page.getByRole("button", { name: /모바일/ }).click();
    await expect(page.getByRole("button", { name: /모바일/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("[data-viewport=mobile]")).toHaveCSS("width", "390px");
    await page.screenshot({ path: `${screens}/admin-mobile.png` });
    await page.getByRole("button", { name: /데스크톱/ }).click();

    // 기본 페이지는 공개 사이트와 같은 목록을 미리보기로 보여준다
    await sidebar.getByRole("button", { name: /회사 경험/ }).click();
    await expect(
      page.locator("[data-viewport]").getByRole("heading", { name: "샘플 회사 A" }),
    ).toBeVisible();
    await sidebar.getByRole("button", { name: /^홈/ }).click();
  });

  test("바꿀 것이 없으면 저장·게시 버튼이 꺼져 있다", async () => {
    await expect(page.getByRole("button", { name: "초안 저장" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "게시", exact: true })).toBeDisabled();
  });

  test("잘못된 값은 해당 칸에 오류로 보이고 저장할 수 없다", async () => {
    const sidebar = page.getByRole("complementary", { name: "페이지와 콘텐츠" });
    await sidebar.getByRole("tab", { name: "콘텐츠" }).click();
    await sidebar.getByRole("button", { name: "프로필" }).click();
    const name = page.getByLabel("이름", { exact: true });
    await name.fill("");
    await expect(page.locator("[data-slot=field-error]").first()).toHaveText("값을 입력하세요.");
    await expect(page.getByRole("button", { name: /오류 1개/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "초안 저장" })).toBeDisabled();
    await page.screenshot({ path: `${screens}/admin-edit-error.png` });
    await name.fill("홍길동");
    await expect(page.getByRole("button", { name: /오류/ })).toHaveCount(0);
    await expect(page.getByTestId("draft-status")).toHaveText("게시됨 · 버전 1");
  });

  test("편집 → 저장 → 게시하면 공개 사이트에 반영된다", async ({ browser }) => {
    const headline = "편집으로 바꾼 대표 문구";
    await page.getByLabel("대표 문구").fill(headline);
    await expect(page.getByTestId("draft-status")).toHaveText("저장하지 않은 변경");
    await expect(page.locator("[data-viewport] h1").first()).toHaveText(headline);
    await expect(page.getByRole("button", { name: "게시", exact: true })).toBeDisabled();

    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByRole("status")).toContainText("초안을 저장했습니다");
    await expect(page.getByTestId("draft-status")).toHaveText("게시하지 않은 초안");

    // 저장만 해서는 공개 사이트가 바뀌지 않는다
    const visitor = await browser.newPage();
    await visitor.goto(`http://localhost:${ports.webApi}/`);
    await expect(visitor.getByRole("heading", { level: 1 })).toContainText("아이디어를 제품으로");

    await page.getByRole("button", { name: "게시", exact: true }).click();
    await page.getByLabel("메모 (선택)").fill("스모크 테스트 게시");
    await page.getByRole("dialog").getByRole("button", { name: "게시" }).click();
    await expect(page.getByRole("status")).toContainText("버전 2을 게시했습니다");
    await expect(page.getByTestId("draft-status")).toHaveText("게시됨 · 버전 2");

    await visitor.reload();
    await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(headline);
    await visitor.close();
  });

  test("이전 버전을 복원해 게시하면 기록에 남는다", async ({ browser }) => {
    await page.getByRole("button", { name: "버전 기록" }).click();
    const sheet = page.getByRole("dialog", { name: "버전 기록" });
    await expect(sheet.getByText("스모크 테스트 게시")).toBeVisible();
    await page.screenshot({ path: `${screens}/admin-history.png` });
    await sheet
      .getByRole("listitem")
      .filter({ hasText: "버전 1" })
      .getByRole("button", { name: /복원/ })
      .click();
    await page
      .getByRole("dialog", { name: /버전 1의 내용으로/ })
      .getByRole("button", { name: "복원" })
      .click();
    await expect(page.getByRole("status")).toContainText("버전 1의 내용을 초안으로 가져왔습니다");
    await expect(page.getByTestId("draft-status")).toHaveText("게시하지 않은 초안");

    await page.getByRole("button", { name: "게시", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "게시" }).click();
    await expect(page.getByRole("status")).toContainText("버전 3을 게시했습니다");

    const versions = await page.request.get(`${admin}/api/admin/versions`);
    const body = (await versions.json()) as {
      versions: { version: number; restoredFrom: number | null }[];
    };
    expect(body.versions[0]).toMatchObject({ version: 3, restoredFrom: 1 });

    const visitor = await browser.newPage();
    await visitor.goto(`http://localhost:${ports.webApi}/`);
    await expect(visitor.getByRole("heading", { level: 1 })).toContainText("아이디어를 제품으로");
    await visitor.close();
  });

  test("모듈을 추가하고 삭제할 수 있다", async () => {
    const sidebar = page.getByRole("complementary", { name: "페이지와 콘텐츠" });
    await sidebar.getByRole("tab", { name: "페이지" }).click();
    await page.getByRole("button", { name: "현재 상태 모듈 추가" }).click();
    const settings = page.getByRole("complementary", { name: "설정" });
    await expect(settings.getByRole("heading", { level: 2 })).toHaveText("현재 상태");
    await settings.getByLabel("제목", { exact: true }).fill("추가한 상태 카드");
    await expect(page.locator("[data-viewport]").getByText("추가한 상태 카드")).toBeVisible();

    await settings.getByRole("button", { name: "모듈 삭제" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "삭제" }).click();
    await expect(page.locator("[data-viewport]").getByText("추가한 상태 카드")).toHaveCount(0);
    // 추가 후 삭제했으므로 저장된 초안과 같다
    await expect(page.getByTestId("draft-status")).toHaveText("게시됨 · 버전 3");
  });

  test("다른 곳에서 먼저 저장하면 덮어쓰지 않고 알린다", async () => {
    const { draft } = (await (await page.request.get(`${admin}/api/admin/draft`)).json()) as {
      draft: { revision: number; document: unknown };
    };
    const background = await page.request.put(`${admin}/api/admin/draft`, {
      headers: { origin: admin },
      data: { revision: draft.revision, document: draft.document },
    });
    expect(background.status()).toBe(200);

    await page.getByRole("button", { name: "개인 프로젝트 목록 모듈 선택" }).click();
    await page.getByLabel("제목", { exact: true }).fill("충돌 테스트");
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByRole("alert").filter({ hasText: "먼저 바뀌었습니다" })).toBeVisible();

    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "최신 초안 불러오기" }).click();
    await expect(page.getByRole("status")).toContainText("최신 초안을 불러왔습니다");
    await expect(page.getByTestId("draft-status")).toHaveText("게시됨 · 버전 3");
  });

  test("프로젝트 본문을 블록 편집기로 쓰고 저장한다 (한글 조합·중첩 목록)", async () => {
    const sidebar = page.getByRole("complementary", { name: "페이지와 콘텐츠" });
    await sidebar.getByRole("tab", { name: "콘텐츠" }).click();
    await sidebar.getByRole("button", { name: "단어장" }).click();
    await page.getByRole("button", { name: "본문 편집" }).click();
    const editor = page.getByRole("textbox", { name: "단어장 본문" });
    await editor.waitFor();
    await editor.click();

    // 슬래시 메뉴: 이모지는 없고 안내 상자는 있다
    await page.keyboard.type("/");
    const menu = page.locator(".bn-suggestion-menu");
    await expect(menu.getByText("안내 상자", { exact: true })).toBeVisible();
    await expect(menu.getByText("이모지", { exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Backspace");

    // 한글 조합 입력 (Chrome DevTools 프로토콜로 조합 과정을 흉내 낸다)
    const cdp = await page.context().newCDPSession(page);
    for (const [steps, final] of [
      [["ㅁ", "무", "문"], "문"],
      [["ㅈ", "제"], "제"],
    ] as const) {
      for (const text of steps) {
        await cdp.send("Input.imeSetComposition", {
          text,
          selectionStart: text.length,
          selectionEnd: text.length,
        });
      }
      await cdp.send("Input.insertText", { text: final });
    }
    await page.keyboard.press("Enter");
    await page.keyboard.type("- ");
    await page.keyboard.insertText("상위 항목");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await page.keyboard.insertText("하위 항목");
    await page.screenshot({ path: `${screens}/admin-body-editor.png` });
    // 편집기 안의 Esc는 패널을 닫지 않는다 (슬래시 메뉴를 닫을 때 패널이 함께 닫히던 문제)
    const sheet = page.getByRole("dialog", { name: "단어장 본문" });
    await page.keyboard.press("Escape");
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "닫기" }).click();
    await expect(sheet).toBeHidden();

    await expect(page.getByText("블록 2개")).toBeVisible();
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByRole("status")).toContainText("초안을 저장했습니다");

    const { draft } = (await (await page.request.get(`${admin}/api/admin/draft`)).json()) as {
      draft: { document: { content: { projects: { title: string; body: unknown[] }[] } } };
    };
    const body = draft.document.content.projects.find((p) => p.title === "단어장")?.body;
    expect(body).toEqual([
      expect.objectContaining({ type: "paragraph", text: [{ text: "문제" }] }),
      expect.objectContaining({
        type: "bulleted-list",
        items: [{ text: [{ text: "상위 항목" }], children: [{ text: [{ text: "하위 항목" }] }] }],
      }),
    ]);
  });

  test("히스토리 항목을 추가해 게시하면 공개 히스토리에 보인다", async ({ browser }) => {
    const sidebar = page.getByRole("complementary", { name: "페이지와 콘텐츠" });
    await sidebar.getByRole("tab", { name: "콘텐츠" }).click();
    await sidebar.getByRole("button", { name: "히스토리" }).click();
    const settings = page.getByRole("complementary", { name: "설정" });
    await settings.getByRole("button", { name: "항목 추가" }).nth(1).click();
    const titles = settings.getByLabel("제목", { exact: true });
    await titles.last().fill("스모크 히스토리 항목");
    await settings.getByLabel("연결").last().click();
    await page.getByRole("option", { name: "회사 · 샘플 회사 D" }).click();
    await page.screenshot({ path: `${screens}/admin-history-editor.png` });

    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByRole("status")).toContainText("초안을 저장했습니다");
    await page.getByRole("button", { name: "게시", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "게시" }).click();
    await expect(page.getByRole("status")).toContainText("을 게시했습니다");

    const visitor = await browser.newPage();
    await visitor.goto(`http://localhost:${ports.webApi}/history`);
    const entry = visitor.getByRole("listitem").filter({ hasText: "스모크 히스토리 항목" });
    await expect(entry).toBeVisible();
    await expect(entry.getByRole("link", { name: /샘플 회사 D/ })).toHaveAttribute(
      "href",
      "/experience/company-d",
    );
    await visitor.close();
  });

  test("업로드한 사진은 위치 정보를 지우고 회전을 반영한 WebP로 저장한다", async () => {
    const file = await gpsPhoto();
    const res = await page.request.post(`${admin}/api/admin/media`, {
      headers: { origin: admin },
      multipart: {
        file: { name: "gps.jpg", mimeType: "image/jpeg", buffer: await fs.readFile(file) },
      },
    });
    expect(res.status()).toBe(201);
    const { asset } = (await res.json()) as {
      asset: { id: string; width: number; height: number; widths: number[] };
    };
    // 세로 회전(6)이 반영되어 2000×3000 세로 이미지가 된다
    expect(asset).toMatchObject({ width: 2000, height: 3000, widths: [480, 960, 1600, 2000] });

    const served = await page.request.get(`${admin}/api/public/v1/media/${asset.id}/480.webp`);
    expect(served.headers()["content-type"]).toBe("image/webp");
    expect(served.headers()["cache-control"]).toContain("immutable");
    expect(await imageInfo(await served.body())).toEqual({
      format: "webp",
      width: 480,
      height: 720,
      exif: false,
      xmp: false,
    });
    unusedAssetId = asset.id;
  });

  test("SVG와 10MB를 넘는 파일은 거부한다", async () => {
    const svg = await page.request.post(`${admin}/api/admin/media`, {
      headers: { origin: admin },
      multipart: {
        file: {
          name: "image.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
          ),
        },
      },
    });
    expect(svg.status()).toBe(400);
    expect((await svg.json()).error.code).toBe("unsupported_media");
    const big = await page.request.post(`${admin}/api/admin/media`, {
      headers: { origin: admin },
      multipart: {
        file: {
          name: "big.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.alloc(11 * 1024 * 1024, 1),
        },
      },
    });
    expect(big.status()).toBe(413);
  });

  test("커버 이미지를 고르고 게시하면 공개 사이트에서 /media 주소로 보인다", async ({
    browser,
    request,
  }) => {
    const sidebar = page.getByRole("complementary", { name: "페이지와 콘텐츠" });
    await sidebar.getByRole("tab", { name: "콘텐츠" }).click();
    await sidebar.getByRole("button", { name: "책갈피" }).click();
    const settings = page.getByRole("complementary", { name: "설정" });
    await settings.getByRole("button", { name: "이미지 고르기" }).click();
    const picker = page.getByRole("dialog", { name: "이미지 고르기" });
    await picker.locator("input[type=file]").setInputFiles(await gpsPhoto());
    await expect(picker).toBeHidden();
    await settings.getByLabel("대체 텍스트").fill("독서 기록 화면");
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByRole("status")).toContainText("초안을 저장했습니다");
    await page.getByRole("button", { name: "게시", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "게시" }).click();
    await expect(page.getByRole("status")).toContainText("을 게시했습니다");

    const visitor = await browser.newPage();
    await visitor.goto(`http://localhost:${ports.webApi}/projects/bookmark`);
    const cover = visitor.getByRole("img", { name: "독서 기록 화면" });
    await expect(cover).toBeVisible();
    await expect
      .poll(() => cover.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    const src = (await cover.getAttribute("src")) ?? "";
    expect(src).toMatch(/^\/media\/med_[a-f0-9]{16}\/\d+\.webp$/);
    const proxied = await request.get(`http://localhost:${ports.webApi}${src}`);
    expect(proxied.status()).toBe(200);
    expect(proxied.headers()["cache-control"]).toContain("immutable");
    await visitor.close();
    usedAssetId = src.split("/")[2] ?? "";

    // 샘플 모드에는 업로드 이미지가 없다
    expect((await request.get(`${web}${src}`)).status()).toBe(404);
  });

  test("사용 중인 이미지는 삭제할 수 없고, 쓰지 않는 이미지는 삭제된다", async () => {
    const inUse = await page.request.delete(`${admin}/api/admin/media/${usedAssetId}`, {
      headers: { origin: admin },
    });
    expect(inUse.status()).toBe(409);
    expect((await inUse.json()).error.code).toBe("in_use");
    const unused = await page.request.delete(`${admin}/api/admin/media/${unusedAssetId}`, {
      headers: { origin: admin },
    });
    expect(unused.status()).toBe(204);
    expect(
      (await page.request.get(`${admin}/api/public/v1/media/${unusedAssetId}/480.webp`)).status(),
    ).toBe(404);
  });

  test("관리자 API는 로그인과 같은 출처를 요구한다", async ({ playwright }) => {
    const anonymous = await playwright.request.newContext();
    expect((await anonymous.get(`${admin}/api/admin/draft`)).status()).toBe(401);
    await anonymous.dispose();
    const crossSite = await page.request.put(`${admin}/api/admin/draft`, {
      headers: { origin: "https://attacker.example" },
      data: {},
    });
    expect(crossSite.status()).toBe(403);
    const invalid = await page.request.put(`${admin}/api/admin/draft`, {
      headers: { origin: admin },
      data: { revision: 1, document: { site: {} } },
    });
    expect(invalid.status()).toBe(400);
  });

  test("로그아웃하면 다시 로그인 화면으로 간다", async () => {
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(`${admin}/login`);
    await page.goto(admin);
    await expect(page).toHaveURL(`${admin}/login`);
  });

  test("로그인 시도가 많으면 잠시 막는다", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await page.request.post(`${admin}/api/auth/sign-in/username`, {
        headers: { origin: admin },
        data: { username: testAdmin.username, password: "wrong-password" },
      });
      statuses.push(res.status());
    }
    expect(statuses).toContain(429);
  });
});
