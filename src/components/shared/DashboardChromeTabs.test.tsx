import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardChromeTabs } from "./DashboardChromeTabs";

const baseTheme = {
  bg: "bg-gray-100",
  tabActiveBorder: "border-gray-300",
  tabActiveBg: "bg-white",
  tabInactiveBg: "bg-gray-200",
  tabInactiveHover: "hover:bg-gray-100",
  closeHover: "hover:bg-gray-300",
  addBtnBg: "bg-gray-200",
  addBtnHover: "hover:bg-gray-300",
  menuHover: "hover:bg-gray-100",
};

const baseProps = {
  tabs: [{ id: "dashboard-1", type: "dashboard", title: "Dashboard" }],
  activeTabId: "dashboard-1",
  onTabSelect: vi.fn(),
  onTabClose: vi.fn(),
  onNewTab: vi.fn(),
  menuGroups: [
    {
      items: [{ type: "users", label: "Quản lý người dùng" }],
    },
  ],
  theme: baseTheme,
};

describe("DashboardChromeTabs", () => {
  it("gọi menu action khi chọn từ menu dấu cộng", () => {
    const onCloseAllTabs = vi.fn();

    render(
      <DashboardChromeTabs
        {...baseProps}
        menuActions={[
          {
            id: "close-all-tabs",
            label: "Đóng tất cả tab",
            onSelect: onCloseAllTabs,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Mở menu tab" }));
    fireEvent.click(screen.getByRole("button", { name: "Đóng tất cả tab" }));

    expect(onCloseAllTabs).toHaveBeenCalledTimes(1);
  });

  it("không gọi menu action khi action bị disable", () => {
    const onCloseAllTabs = vi.fn();

    render(
      <DashboardChromeTabs
        {...baseProps}
        menuActions={[
          {
            id: "close-all-tabs",
            label: "Đóng tất cả tab",
            onSelect: onCloseAllTabs,
            disabled: true,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Mở menu tab" }));
    fireEvent.click(screen.getByRole("button", { name: "Đóng tất cả tab" }));

    expect(onCloseAllTabs).not.toHaveBeenCalled();
  });

  it("đặt nút dấu cộng trong cùng luồng tab ở full mode và tab có width co giãn", () => {
    render(
      <DashboardChromeTabs
        {...baseProps}
        tabs={[
          { id: "dashboard-1", type: "dashboard", title: "Dashboard" },
          { id: "users-1", type: "users", title: "Quản lý người dùng" },
        ]}
        activeTabId="dashboard-1"
      />
    );

    const strip = screen.getByTestId("chrome-tabs-full-strip");
    const plusButton = within(strip).getByRole("button", { name: "Mở menu tab" });
    expect(plusButton).toBeTruthy();

    const dashboardTab = screen.getByText("Dashboard").closest("div");
    expect(dashboardTab?.getAttribute("style") || "").toContain("clamp(");
  });
});
