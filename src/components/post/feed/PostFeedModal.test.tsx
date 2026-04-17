import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { components } from "../../../../schema-from-be";

import { PostFeedModal } from "./PostFeedModal";

const useAuthStoreMock = vi.hoisted(() => vi.fn());
const useCheckLikedMock = vi.hoisted(() => vi.fn());
const useCreateCommentMock = vi.hoisted(() => vi.fn());
const usePostByIdMock = vi.hoisted(() => vi.fn());

vi.mock("@/stores/authStore", () => ({
  useAuthStore: useAuthStoreMock,
}));

vi.mock("@/services/post.manager", () => ({
  useCheckLiked: useCheckLikedMock,
  useCreateComment: useCreateCommentMock,
  usePostById: usePostByIdMock,
}));

vi.mock("../CommentSection", () => ({
  CommentSection: () => <div data-testid="comment-section">comments</div>,
}));

vi.mock("../LikeButton", () => ({
  LikeButton: () => <div data-testid="like-button">likes</div>,
}));

type PostResponse = components["schemas"]["PostResponse"];

const MOCK_ITEM = {
  post: {
    postId: 101,
    title: "Bài test ảnh",
    creationDate: "2026-01-21T08:00:00.000Z",
    coverImgUrl: "https://example.com/post-cover.png",
    author: {
      name: "Tác giả test",
      avatar: "",
    },
    tags: [],
  },
  likeCount: 0,
  commentCount: 0,
  postLikes: [],
  postComments: [],
} as unknown as PostResponse;

function PostFeedModalHarness() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <span data-testid="post-modal-state">{open ? "open" : "closed"}</span>
      <PostFeedModal item={MOCK_ITEM} open={open} onOpenChange={setOpen} />
    </>
  );
}

const openImageViewer = () => {
  fireEvent.click(screen.getByRole("img", { name: "Bài test ảnh" }));
  expect(screen.getByRole("button", { name: "Đóng ảnh" })).toBeInTheDocument();
};

describe("PostFeedModal image viewer", () => {
  beforeEach(() => {
    useAuthStoreMock.mockReturnValue({
      user: {
        id: 12,
        name: "Người dùng test",
        avatarUrl: "",
      },
    });
    useCheckLikedMock.mockReturnValue({ data: { liked: false } });
    useCreateCommentMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    usePostByIdMock.mockReturnValue({ data: undefined });
  });

  it("đóng bằng nút X chỉ tắt ảnh phóng to", async () => {
    render(<PostFeedModalHarness />);

    openImageViewer();
    fireEvent.click(screen.getByRole("button", { name: "Đóng ảnh" }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Đóng ảnh" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("Bài viết của Tác giả test")).toBeInTheDocument();
    expect(screen.getByTestId("post-modal-state")).toHaveTextContent("open");
  });

  it("đóng bằng click nền chỉ tắt ảnh phóng to", async () => {
    render(<PostFeedModalHarness />);

    openImageViewer();
    fireEvent.pointerDown(screen.getByTestId("image-viewer-overlay"));
    fireEvent.click(screen.getByTestId("image-viewer-overlay"));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Đóng ảnh" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("Bài viết của Tác giả test")).toBeInTheDocument();
    expect(screen.getByTestId("post-modal-state")).toHaveTextContent("open");
  });

  it("nhấn Escape lần 1 tắt ảnh, lần 2 mới tắt PostFeedModal", async () => {
    render(<PostFeedModalHarness />);

    openImageViewer();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Đóng ảnh" })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("post-modal-state")).toHaveTextContent("open");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.getByTestId("post-modal-state")).toHaveTextContent("closed");
    });
  });

  it("modal ảnh render ở lớp overlay độc lập phía trước", () => {
    render(<PostFeedModalHarness />);

    openImageViewer();

    expect(screen.getByTestId("image-viewer-overlay")).toHaveClass("z-70");
    expect(screen.getByTestId("image-viewer-content")).toHaveClass("z-80");
  });
});
