import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { InterviewStage } from "./InterviewStage";

describe("InterviewStage", () => {
  it("luôn mount thẻ video để nhận stream camera", () => {
    const { container } = render(
      <InterviewStage
        phaseName="Chào hỏi"
        questionIndex={1}
        totalQuestions={3}
        interviewFinished={false}
        sessionExpiredMidway={false}
        isListening={false}
        isSpeechSupported={true}
        canUseSpeechInput={true}
        speechLanguageLabel="Tiếng Việt"
        isSubmitting={false}
        isEvaluating={false}
        cameraState="requesting"
        cameraMessage={null}
        cameraVideoRef={createRef<HTMLVideoElement>()}
        onToggleListening={vi.fn()}
        onToggleCamera={vi.fn()}
      />
    );

    expect(container.querySelector("video")).toBeInTheDocument();
    expect(screen.getByText("Đang xin quyền camera")).toBeInTheDocument();
  });
});
