import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SocketStatusBadge } from "./SocketStatusBadge";

describe("SocketStatusBadge", () => {
  it("renders connecting state label", () => {
    render(<SocketStatusBadge state="connecting" />);
    expect(screen.getByText("Đang kết nối")).toBeInTheDocument();
  });

  it("renders connected state label", () => {
    render(<SocketStatusBadge state="connected" />);
    expect(screen.getByText("Kết nối ổn định")).toBeInTheDocument();
  });

  it("renders disconnected state label", () => {
    render(<SocketStatusBadge state="disconnected" />);
    expect(screen.getByText("Mất kết nối")).toBeInTheDocument();
  });
});
