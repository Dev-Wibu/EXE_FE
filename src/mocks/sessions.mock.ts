/**
 * Mock data for session management
 */

import type { Session } from "@/interfaces";

export const mockSessions: Session[] = [
  {
    id: 1,
    roomName: "interview-room-001",
    userId: 1,
    participantId1: "user_001",
    startTime1: "2024-01-15T10:00:00Z",
    endTime1: "2024-01-15T11:00:00Z",
    durationSeconds1: 3600,
    userId2: 101,
    participantId2: "mentor_001",
    startTime2: "2024-01-15T10:00:00Z",
    endTime2: "2024-01-15T11:00:00Z",
    durationSeconds2: 3600,
    roomUrl: "https://meeting.example.com/room-001",
    recordUrl: "https://storage.example.com/records/session-001.mp4",
    status: "COMPLETED",
  },
  {
    id: 2,
    roomName: "interview-room-002",
    userId: 2,
    participantId1: "user_002",
    startTime1: "2024-01-16T14:00:00Z",
    userId2: 102,
    participantId2: "mentor_002",
    roomUrl: "https://meeting.example.com/room-002",
    status: "SCHEDULED",
  },
  {
    id: 3,
    roomName: "interview-room-003",
    userId: 3,
    participantId1: "user_003",
    startTime1: "2024-01-17T09:00:00Z",
    endTime1: "2024-01-17T10:30:00Z",
    durationSeconds1: 5400,
    userId2: 103,
    participantId2: "mentor_003",
    startTime2: "2024-01-17T09:05:00Z",
    endTime2: "2024-01-17T10:30:00Z",
    durationSeconds2: 5100,
    roomUrl: "https://meeting.example.com/room-003",
    recordUrl: "https://storage.example.com/records/session-003.mp4",
    status: "COMPLETED",
  },
  {
    id: 4,
    roomName: "interview-room-004",
    userId: 1,
    userId2: 101,
    roomUrl: "https://meeting.example.com/room-004",
    status: "CANCELED",
  },
  {
    id: 5,
    roomName: "interview-room-005",
    userId: 4,
    participantId1: "user_004",
    startTime1: "2024-01-18T15:00:00Z",
    userId2: 104,
    participantId2: "mentor_004",
    startTime2: "2024-01-18T15:00:00Z",
    roomUrl: "https://meeting.example.com/room-005",
    status: "ONGOING",
  },
];

/**
 * Fetch all sessions (mock)
 */
export const fetchSessions = async (): Promise<Session[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...mockSessions];
};

/**
 * Fetch session by ID (mock)
 */
export const fetchSession = async (id: number): Promise<Session | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockSessions.find((session) => session.id === id);
};

/**
 * Fetch sessions by user ID (mock)
 */
export const fetchSessionsByUserId = async (userId: number): Promise<Session[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockSessions.filter((s) => s.userId === userId || s.userId2 === userId);
};
