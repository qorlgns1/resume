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
    const settings = page.getByRole("complementary", { name: "모듈 설정" });
    await expect(settings).toContainText("모듈을 선택하세요");

    await page.getByRole("button", { name: "성과 모듈 선택" }).click();
    await expect(settings.getByRole("heading", { level: 2 })).toHaveText("성과");
    await expect(settings).toContainText("mod_home_achievements");

    const sidebar = page.getByRole("complementary", { name: "페이지와 모듈" });
    await expect(sidebar.locator("button[aria-pressed=true]")).toHaveText(/^성과/);
    await page.screenshot({ path: `${screens}/admin-desktop.png` });

    await page.getByRole("button", { name: /모바일/ }).click();
    await expect(page.getByRole("button", { name: /모바일/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("[data-viewport=mobile]")).toHaveCSS("width", "390px");
    await page.screenshot({ path: `${screens}/admin-mobile.png` });

    await sidebar.getByRole("button", { name: /회사 경험/ }).click();
    await expect(page.getByText("이 페이지에는 아직 모듈이 없습니다")).toBeVisible();
    await expect(settings).toContainText("모듈을 선택하세요");
  });

  test("미구현 동작은 비활성이며 성공 메시지를 띄우지 않는다", async () => {
    for (const name of [/초안 저장/, /게시/, /버전 기록/]) {
      const button = page.getByRole("button", { name });
      await expect(button).toHaveAttribute("aria-disabled", "true");
      // aria-disabled 버튼은 Playwright가 비활성으로 보므로 강제로 클릭해 아무 일도 없는지 확인한다.
      await button.click({ force: true });
    }
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByText(/저장되었습니다|게시되었습니다/)).toHaveCount(0);
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
