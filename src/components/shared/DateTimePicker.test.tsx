import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DateTimePicker } from "./DateTimePicker";

describe("DateTimePicker Component", () => {
  it("renders with placeholder in input trigger", () => {
    render(<DateTimePicker value={null} onChange={() => {}} />);
    const input = screen.getByPlaceholderText("dd/mm/yyyy --:--") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("dd/mm/yyyy --:--");
  });

  it("renders formatted date value in the input trigger", () => {
    const testDate = new Date(2026, 5, 11, 14, 30); // 11th June 2026 14:30
    render(<DateTimePicker value={testDate} onChange={() => {}} />);
    const input = screen.getByDisplayValue("11/06/2026 14:30") as HTMLInputElement;
    expect(input).toBeInTheDocument();
  });

  it("opens popover on click and renders presets and time columns", () => {
    const testDate = new Date(2026, 5, 11, 14, 30);
    render(<DateTimePicker value={testDate} onChange={() => {}} showTime={true} />);

    const openCalendarBtn = screen.getByRole("button", { name: /open calendar/i });
    fireEvent.click(openCalendarBtn);

    // Check custom header displays the month/year
    expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0);

    // Check presets are rendered (locale-independent check)
    const todayElements = screen.getAllByText(/today|hôm nay/i);
    expect(todayElements.length).toBeGreaterThan(0);

    // Check time heading is rendered
    expect(screen.getByText(/time/i)).toBeInTheDocument();
  });

  it("does not render time-based presets when showTime={false}", () => {
    render(<DateTimePicker value={null} onChange={() => {}} showTime={false} />);
    const openCalendarBtn = screen.getByRole("button", { name: /open calendar/i });
    fireEvent.click(openCalendarBtn);

    // Presets list should NOT contain time presets like "+15 Phút"
    expect(screen.queryByText("+15 Phút")).not.toBeInTheDocument();
    expect(screen.queryByText("+30 Phút")).not.toBeInTheDocument();
    expect(screen.queryByText("+1 Giờ")).not.toBeInTheDocument();

    // But should contain "Hôm nay"
    const todayElements = screen.getAllByText(/today|hôm nay/i);
    expect(todayElements.length).toBeGreaterThan(0);
  });

  it("calls onChange with null when Xóa (Clear) is clicked", () => {
    const testDate = new Date(2026, 5, 11, 14, 30);
    const onChangeMock = vi.fn();
    render(<DateTimePicker value={testDate} onChange={onChangeMock} />);

    const openCalendarBtn = screen.getByRole("button", { name: /open calendar/i });
    fireEvent.click(openCalendarBtn);

    // Find clear button in the popover footer
    const clearBtn = screen
      .getAllByText(/xóa|clear/i)
      .find((el) => el.tagName.toLowerCase() === "button");
    expect(clearBtn).toBeDefined();
    fireEvent.click(clearBtn!);

    expect(onChangeMock).toHaveBeenCalledWith(null);
  });

  it("applies today shortcut when Hôm nay is clicked", () => {
    const onChangeMock = vi.fn();
    render(<DateTimePicker value={null} onChange={onChangeMock} />);

    const openCalendarBtn = screen.getByRole("button", { name: /open calendar/i });
    fireEvent.click(openCalendarBtn);

    // Find the today shortcut/preset button (first element matching Today/Hôm nay)
    const todayBtn = screen
      .getAllByText(/today|hôm nay/i)
      .find((el) => el.tagName.toLowerCase() === "button");
    expect(todayBtn).toBeDefined();
    fireEvent.click(todayBtn!);

    expect(onChangeMock).toHaveBeenCalled();
    const resultDate = onChangeMock.mock.calls[0][0] as Date;
    expect(resultDate).toBeInstanceOf(Date);
  });

  it("handles keyboard manual typing input (valid format)", () => {
    const onChangeMock = vi.fn();
    render(<DateTimePicker value={null} onChange={onChangeMock} />);

    const input = screen.getByPlaceholderText("dd/mm/yyyy --:--") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "15/08/2026 18:15" } });
    fireEvent.blur(input);

    expect(onChangeMock).toHaveBeenCalled();
    const resultDate = onChangeMock.mock.calls[0][0] as Date;
    expect(resultDate.getFullYear()).toBe(2026);
    expect(resultDate.getMonth()).toBe(7); // August (7 in JS Date)
    expect(resultDate.getDate()).toBe(15);
    expect(resultDate.getHours()).toBe(18);
    expect(resultDate.getMinutes()).toBe(15);
  });

  it("handles keyboard manual typing input (invalid format) and displays error tooltip on blur", () => {
    const onChangeMock = vi.fn();
    render(<DateTimePicker value={null} onChange={onChangeMock} />);

    const input = screen.getByPlaceholderText("dd/mm/yyyy --:--") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.blur(input);

    // Warning message should be rendered in the dark tooltip below the trigger input
    const errorText = screen.getByText(
      /trường không hoàn chỉnh hoặc có giá trị không hợp lệ|incomplete or has an invalid value/i
    );
    expect(errorText).toBeInTheDocument();
  });

  it("auto-corrects typed year outside the +/- 100 years boundary (e.g. 2127) to the boundary year (2126)", () => {
    const onChangeMock = vi.fn();
    render(<DateTimePicker value={null} onChange={onChangeMock} />);

    const input = screen.getByPlaceholderText("dd/mm/yyyy --:--") as HTMLInputElement;
    // Current year is 2026, 2127 is beyond currentYear + 100 (2126), so it clamps to 2126
    fireEvent.change(input, { target: { value: "15/08/2127 18:15" } });
    fireEvent.blur(input);

    expect(onChangeMock).toHaveBeenCalled();
    const resultDate = onChangeMock.mock.calls[0][0] as Date;
    expect(resultDate.getFullYear()).toBe(2126);
    expect(input.value).toBe("15/08/2126 18:15");
  });

  it("auto-corrects typed year way outside boundary (e.g. 9999) to the boundary year (2126)", () => {
    const onChangeMock = vi.fn();
    render(<DateTimePicker value={null} onChange={onChangeMock} />);

    const input = screen.getByPlaceholderText("dd/mm/yyyy --:--") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "15/08/9999 18:15" } });
    fireEvent.blur(input);

    expect(onChangeMock).toHaveBeenCalled();
    const resultDate = onChangeMock.mock.calls[0][0] as Date;
    expect(resultDate.getFullYear()).toBe(2126);
    expect(input.value).toBe("15/08/2126 18:15");
  });

  it("fails validation when year is incomplete (e.g. 212) and displays error tooltip on blur", () => {
    const onChangeMock = vi.fn();
    render(<DateTimePicker value={null} onChange={onChangeMock} />);

    const input = screen.getByPlaceholderText("dd/mm/yyyy --:--") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "15/08/212" } });
    fireEvent.blur(input);

    const errorText = screen.getByText(
      /trường không hoàn chỉnh hoặc có giá trị không hợp lệ|incomplete or has an invalid value/i
    );
    expect(errorText).toBeInTheDocument();
    expect(onChangeMock).not.toHaveBeenCalled();
  });

  it("passes validation when typed year is inside the +/- 100 years boundary", () => {
    const onChangeMock = vi.fn();
    render(<DateTimePicker value={null} onChange={onChangeMock} />);

    const input = screen.getByPlaceholderText("dd/mm/yyyy --:--") as HTMLInputElement;
    // 2126 is exactly currentYear + 100 (if current year is 2026)
    fireEvent.change(input, { target: { value: "15/08/2126 18:15" } });
    fireEvent.blur(input);

    expect(onChangeMock).toHaveBeenCalled();
    const resultDate = onChangeMock.mock.calls[0][0] as Date;
    expect(resultDate.getFullYear()).toBe(2126);
  });
});
