import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MessageBubble } from "./MessageBubble";

describe("MessageBubble", () => {
  it("highlights search keyword and shows failed status", () => {
    render(
      <MessageBubble
        id="temp-1"
        sender="user"
        content="Xin chao mentor"
        timestamp="2026-04-13T10:20:30.000Z"
        searchQuery="mentor"
        status="failed"
      />
    );

    expect(screen.getByText("Gửi lỗi")).toBeInTheDocument();
    expect(screen.getByText("mentor").tagName).toBe("MARK");
  });

  it("opens context menu and triggers copy callback", () => {
    const onCopy = vi.fn();

    render(
      <MessageBubble
        id="temp-2"
        sender="ai"
        content="Noi dung can sao chep"
        timestamp="2026-04-13T10:20:30.000Z"
        onCopy={onCopy}
      />
    );

    fireEvent.contextMenu(screen.getByText("Noi dung can sao chep"));
    fireEvent.click(screen.getByText("Sao chép nội dung"));

    expect(onCopy).toHaveBeenCalledWith("Noi dung can sao chep");
  });

  it("shows retry action for failed message", () => {
    const onRetry = vi.fn();

    render(
      <MessageBubble
        id="temp-3"
        sender="user"
        content="Thu lai"
        timestamp="2026-04-13T10:20:30.000Z"
        status="failed"
        onRetry={onRetry}
      />
    );

    fireEvent.contextMenu(screen.getByText("Thu lai"));
    fireEvent.click(screen.getByText("Gửi lại tin nhắn"));

    expect(onRetry).toHaveBeenCalledWith("temp-3");
  });

  it("triggers forward and pin actions", () => {
    const onForward = vi.fn();
    const onTogglePin = vi.fn();

    render(
      <MessageBubble
        id="temp-4"
        sender="ai"
        content="Noi dung de chuyen tiep"
        timestamp="2026-04-13T10:20:30.000Z"
        onForward={onForward}
        onTogglePin={onTogglePin}
      />
    );

    fireEvent.contextMenu(screen.getByText("Noi dung de chuyen tiep"));
    fireEvent.click(screen.getByText("Chuyển tiếp vào ô soạn"));
    expect(onForward).toHaveBeenCalledWith("Noi dung de chuyen tiep");

    fireEvent.contextMenu(screen.getByText("Noi dung de chuyen tiep"));
    fireEvent.click(screen.getByText("Ghim tin nhắn"));
    expect(onTogglePin).toHaveBeenCalledWith("temp-4");
  });

  it("shows pinned indicator when message is pinned", () => {
    render(
      <MessageBubble
        id="temp-5"
        sender="user"
        content="Da ghim"
        timestamp="2026-04-13T10:20:30.000Z"
        isPinned
      />
    );

    expect(screen.getByText("Đã ghim")).toBeInTheDocument();
  });
});
