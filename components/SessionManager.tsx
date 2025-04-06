"use client";

import React, { useEffect, useState } from "react";
import { useAuth, Session } from "@/lib/hooks/useAuth";
import { FiLogOut, FiRefreshCw, FiInfo, FiX, FiCheck } from "react-icons/fi";
import { formatDate, formatTimeAgo } from "@/lib/utils/dateFormatters";
import { toast } from "react-hot-toast";

export default function SessionManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const { getSessions, terminateSession, terminateAllOtherSessions } =
    useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      if (isOpen) {
        setSessionsLoading(true);
        try {
          const sessionData = await getSessions();
          setSessions(sessionData);
        } catch (error) {
          console.error("Failed to fetch sessions:", error);
          toast.error("Failed to load active sessions");
        } finally {
          setSessionsLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen, getSessions]);

  const handleTerminate = async (session: Session) => {
    if (session.isCurrentSession) {
      toast.error("Cannot terminate the current session");
      return;
    }

    await terminateSession(session.id);
  };

  const handleTerminateAll = async () => {
    if (confirm("Are you sure you want to log out from all other devices?")) {
      await terminateAllOtherSessions();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-indigo-600 transition-colors"
        title="Manage sessions"
      >
        <FiInfo className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
            <h3 className="text-lg font-medium">Active Sessions</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            {sessionsLoading ? (
              <div className="flex justify-center p-4">
                <FiRefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No active sessions found
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-md border ${
                      session.isCurrentSession
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        {session.isCurrentSession && (
                          <span className="mr-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full flex items-center">
                            <FiCheck className="h-3 w-3 mr-1" /> Current
                          </span>
                        )}
                        <div className="text-sm font-medium">
                          {session.userAgent
                            ? session.userAgent.substring(0, 40) +
                              (session.userAgent.length > 40 ? "..." : "")
                            : "Unknown device"}
                        </div>
                      </div>
                      {!session.isCurrentSession && (
                        <button
                          onClick={() => handleTerminate(session)}
                          className="text-red-500 hover:text-red-700"
                          title="Terminate session"
                        >
                          <FiLogOut className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Created: {formatDate(session.createdAt)}</span>
                        <span>
                          Last active: {formatTimeAgo(session.lastUsed)}
                        </span>
                      </div>
                      <div className="mt-1">
                        Expires: {formatDate(session.expiresAt)}
                      </div>
                    </div>
                  </div>
                ))}

                {sessions.length > 1 && (
                  <button
                    onClick={handleTerminateAll}
                    className="w-full mt-4 py-2 px-4 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50 text-sm font-medium transition-colors"
                  >
                    Log out from all other devices
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
