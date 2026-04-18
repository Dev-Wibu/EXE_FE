import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TransactionHistoryTab } from "./TransactionHistoryTab";

describe("TransactionHistoryTab", () => {
  it("shows purpose badge for classified payment purpose", () => {
    render(
      <TransactionHistoryTab
        isLoading={false}
        transactions={[
          {
            id: 1,
            amount: 35000,
            transactionCode: "TX-1",
            createdAt: "2026-04-18T03:00:00",
            paymentPurpose: "BUY_MEMBERSHIP",
            description: "Thanh toán gói thành viên",
          } as never,
        ]}
      />
    );

    expect(screen.getByText("Mua gói")).toBeInTheDocument();
    expect(screen.getByText("Hoàn thành")).toBeInTheDocument();
  });

  it("does not show purpose badge when purpose is unknown", () => {
    render(
      <TransactionHistoryTab
        isLoading={false}
        transactions={[
          {
            id: 2,
            amount: 15000,
            transactionCode: "TX-2",
            createdAt: "2026-04-18T03:10:00",
            paymentPurpose: undefined,
            description: "",
            currentBalance: 100000,
          } as never,
        ]}
      />
    );

    expect(screen.queryByText("Chưa phân loại")).not.toBeInTheDocument();
  });
});
