/**
 * MockInterviewSchedulePage - redirects to select-mentor page
 * The scheduling flow has been simplified: users now create sessions
 * directly from the mentor selection page.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function MockInterviewSchedulePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard/mock-interview/select-mentor", { replace: true });
  }, [navigate]);

  return null;
}
