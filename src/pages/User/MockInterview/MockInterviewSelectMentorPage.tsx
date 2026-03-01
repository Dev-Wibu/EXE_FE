/**
 * MockInterviewSelectMentorPage - redirects to schedule page
 * Mentor selection is now part of the redesigned scheduling flow
 * which includes: Select Mentor → Choose Date/Time → Confirm & Create
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function MockInterviewSelectMentorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/user/mock-interview/schedule", { replace: true });
  }, [navigate]);

  return null;
}
