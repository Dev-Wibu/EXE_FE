import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUserCameraPreview } from "./useUserCameraPreview";

const warningMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    warning: warningMock,
  },
}));

interface MockTrack {
  stop: () => void;
}

interface MockStream {
  getTracks: () => MockTrack[];
}

const createMockStream = (): MockStream => {
  const track: MockTrack = {
    stop: vi.fn(),
  };

  return {
    getTracks: () => [track],
  };
};

describe("useUserCameraPreview", () => {
  const originalMediaDevices = navigator.mediaDevices;

  beforeEach(() => {
    warningMock.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it("uu tien mo camera theo preferred device id", async () => {
    const getUserMediaMock = vi.fn().mockResolvedValue(createMockStream());

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: getUserMediaMock,
      },
    });

    const { result } = renderHook(() => useUserCameraPreview(false, "preferred-device-id"));

    await act(async () => {
      await result.current.startCamera();
    });

    expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    expect(getUserMediaMock).toHaveBeenCalledWith({
      video: {
        deviceId: { exact: "preferred-device-id" },
        width: { ideal: 640 },
        height: { ideal: 360 },
      },
      audio: false,
    });
    expect(result.current.state).toBe("granted");
    expect(result.current.message).toBeNull();
    expect(warningMock).not.toHaveBeenCalled();
  });

  it("fallback sang camera mac dinh va hien warning khi preferred camera loi", async () => {
    const getUserMediaMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("Missing preferred camera", "NotFoundError"))
      .mockResolvedValueOnce(createMockStream());

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: getUserMediaMock,
      },
    });

    const { result } = renderHook(() => useUserCameraPreview(false, "preferred-device-id"));

    await act(async () => {
      await result.current.startCamera();
    });

    await waitFor(() => {
      expect(result.current.state).toBe("granted");
    });

    expect(getUserMediaMock).toHaveBeenCalledTimes(2);
    expect(getUserMediaMock.mock.calls[0][0]).toEqual({
      video: {
        deviceId: { exact: "preferred-device-id" },
        width: { ideal: 640 },
        height: { ideal: 360 },
      },
      audio: false,
    });
    expect(getUserMediaMock.mock.calls[1][0]).toEqual({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 360 },
      },
      audio: false,
    });
    expect(result.current.message).toBe(
      "Không mở được camera đã chọn, hệ thống đã chuyển sang camera mặc định."
    );
    expect(warningMock).toHaveBeenCalledWith(
      "Không mở được camera đã chọn, hệ thống đã chuyển sang camera mặc định."
    );
  });
});
