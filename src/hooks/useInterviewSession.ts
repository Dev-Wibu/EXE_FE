import { $api } from "@/lib/api";

export const useInterviewConfigOptions = (enabled = true) =>
  $api.useQuery("get", "/api/interview-sessions/config-options", undefined, { enabled });

export const useGenerateJobRequirement = () =>
  $api.useMutation("post", "/api/interview-sessions/generate-job-requirement");

export const useCreateInterviewSession = () =>
  $api.useMutation("post", "/api/interview-sessions/create-session");

export const useInterviewSession = (sessionId: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/interview-sessions/{sessionId}",
    { params: { path: { sessionId } } },
    { enabled: enabled && sessionId > 0 }
  );

export const useInterviewSessionsByUser = (userId: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/interview-sessions/user/{userId}",
    { params: { path: { userId } } },
    { enabled: enabled && userId > 0 }
  );

export const useInterviewSessionCache = (sessionKey: string, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/interview-sessions/cache/{sessionKey}",
    { params: { path: { sessionKey } } },
    { enabled: enabled && sessionKey.length > 0 }
  );
