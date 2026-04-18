import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PaymentMethodDialog } from "./PaymentMethodDialog";

describe("PaymentMethodDialog", () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "Chọn phương thức thanh toán",
    amount: 35000,
    onConfirm: vi.fn(),
  };

  it("hiển thị trạng thái đang đồng bộ khi chưa có số dư ví", () => {
    render(<PaymentMethodDialog {...baseProps} walletBalance={undefined} />);

    expect(screen.getByText("Số dư hiện tại: Đang đồng bộ...")).toBeInTheDocument();
    expect(
      screen.getByText("Chưa đồng bộ được số dư ví. Vui lòng thử lại hoặc chọn PayOS.")
    ).toBeInTheDocument();

    const walletRadio = screen.getByRole("radio", { name: /Thanh toán bằng ví/i });
    expect(walletRadio).toBeDisabled();
  });

  it("cho phép chọn ví khi số dư đủ", () => {
    render(<PaymentMethodDialog {...baseProps} walletBalance={150000} defaultMethod="wallet" />);

    const walletRadio = screen.getByRole("radio", { name: /Thanh toán bằng ví/i });
    expect(walletRadio).toBeEnabled();
    expect(screen.queryByText("Số dư ví không đủ cho giao dịch này.")).not.toBeInTheDocument();
  });

  it("chặn phương thức ví khi số dư không đủ", () => {
    render(<PaymentMethodDialog {...baseProps} walletBalance={10000} defaultMethod="wallet" />);

    const walletRadio = screen.getByRole("radio", { name: /Thanh toán bằng ví/i });
    expect(walletRadio).toBeDisabled();
    expect(screen.getByText("Số dư ví không đủ cho giao dịch này.")).toBeInTheDocument();
  });
});
