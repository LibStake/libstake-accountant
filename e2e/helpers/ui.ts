import { expect, type Locator, type Page } from "@playwright/test";

// Radix Select(role=combobox)를 aria-label로 찾아 옵션을 고른다. 옵션은 포털로 렌더된다.
export async function selectOption(
  scope: Page | Locator,
  comboboxName: string,
  optionName: string,
): Promise<void> {
  const page = "page" in scope ? scope.page() : scope;
  await scope.getByRole("combobox", { name: comboboxName, exact: true }).click();
  await page.getByRole("option", { name: optionName, exact: true }).click();
}

// AlertDialog 안의 확인 버튼만 눌러 확정한다(트리거의 동명 버튼과 구분).
export async function confirmInDialog(page: Page, buttonName: string): Promise<void> {
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: buttonName }).click();
}

export async function expectToast(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.getByText(text).first()).toBeVisible();
}
