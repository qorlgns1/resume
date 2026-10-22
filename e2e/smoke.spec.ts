import { expect, type Page, test } from "@playwright/test";
import {
  ApiErrorResponseSchema,
  PublicPageResponseSchema,
  type SystemPageKey,
} from "@resume/contracts";
import { ports } from "../playwright.config";

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

test.describe("공개 콘텐츠 API (샘플)", () => {
  for (const key of ["home", "projects", "experience", "history"] satisfies SystemPageKey[]) {
    test(`${key} 응답이 계약을 만족한다`, async ({ request }) => {
      const res = await request.get(`${admin}/api/public/v1/pages/${key}`);
      expect(res.status()).toBe(200);
      expect(res.headers()["cache-control"]).toContain("no-store");
      const body = PublicPageResponseSchema.parse(await res.json());
      expect(body.meta.source).toBe("sample");
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
  test.use({ viewport: { width: 1440, height: 900 } });

  test("페이지·모듈 선택과 미리보기 전환", async ({ page }) => {
    await page.goto(admin);
    const settings = page.getByRole("complementary", { name: "모듈 설정" });
    await expect(settings).toContainText("모듈을 선택하세요");

    await page.getByRole("button", { name: "성과 모듈 선택" }).click();
    await expect(settings.getByRole("heading", { level: 2 })).toHaveText("성과");
    await expect(settings).toContainText("mod_home_achievements");

    // 왼쪽 목록에서도 같은 선택 상태
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

  test("미구현 동작은 비활성이며 성공 메시지를 띄우지 않는다", async ({ page }) => {
    await page.goto(admin);
    for (const name of [/초안 저장/, /게시/, /버전 기록/]) {
      const button = page.getByRole("button", { name });
      await expect(button).toHaveAttribute("aria-disabled", "true");
      // aria-disabled 버튼은 Playwright가 비활성으로 보므로 강제로 클릭해 아무 일도 없는지 확인한다.
      await button.click({ force: true });
    }
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByText(/저장되었습니다|게시되었습니다/)).toHaveCount(0);
  });
});
