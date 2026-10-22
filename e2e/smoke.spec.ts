import { expect, type Page, test } from "@playwright/test";
import {
  ApiErrorResponseSchema,
  PublicPageResponseSchema,
  type SystemPageKey,
} from "@resume/contracts";
import { ports, testAdmin } from "../playwright.config";

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

    await sidebar.getByRole("button", { name: /회사 경험/ }).click();
    await expect(page.getByText("이 페이지에는 아직 모듈이 없습니다")).toBeVisible();
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
