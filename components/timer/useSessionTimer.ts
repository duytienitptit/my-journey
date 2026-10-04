"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { now } from "@/core/clock";
import { isSessionComplete, secondsRemaining } from "@/core/session";
import {
  abandonSessionAction, backfillSessionsAction, completeSessionAction, getSessionStateAction,
  startSessionAction, undoLastManualSessionAction, type SessionsSnapshot,
} from "@/app/actions/sessions";
import type { SessionForDay } from "@/db/queries";

export type ActiveSession = { id: number; labelId: number; startedAt: number; endsAt: number };
type Props = {
  initialActiveSession: ActiveSession | null;
  initialTodaySessions: SessionForDay[];
  initialSummaryLine: string;
  defaultLabelId: number;
  onXpMightHaveChanged?: () => void;
};

export function useSessionTimer({ initialActiveSession, initialTodaySessions, initialSummaryLine, defaultLabelId, onXpMightHaveChanged }: Props) {
  const [selectedLabelId, setSelectedLabelId] = useState(defaultLabelId);
  const [running, setRunning] = useState(initialActiveSession);
  const [nowMs, setNowMs] = useState(() => now());
  const [todaySessions, setTodaySessions] = useState(initialTodaySessions);
  const [summaryLine, setSummaryLine] = useState(initialSummaryLine);
  const [justCompletedLabelId, setJustCompletedLabelId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const completionAttempt = useRef<number | null>(null);
  const applySnapshot = useCallback((snapshot: SessionsSnapshot) => {
    setTodaySessions(snapshot.todaySessions);
    setSummaryLine(snapshot.summaryLine);
  }, []);

  const perform = useCallback(async function performOperation(operation: () => Promise<void>): Promise<boolean> {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    setError(null);
    try { await operation(); return true; }
    catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Check your connection and try again.");
      return false;
    } finally { busy.current = false; setPending(false); }
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNowMs(now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || !isSessionComplete(running, nowMs) || busy.current || completionAttempt.current === running.id) return;
    const finished = running;
    completionAttempt.current = finished.id;
    void perform(async () => {
      const snapshot = await completeSessionAction(finished.id);
      applySnapshot(snapshot);
      setRunning(null);
      setJustCompletedLabelId(finished.labelId);
      onXpMightHaveChanged?.();
      void new Audio("/sounds/session-complete.ogg").play().catch(() => {});
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Nice — take a break", { body: "One session done. A short break sounds good.", silent: true });
      }
    });
  }, [running, nowMs, perform, applySnapshot, onXpMightHaveChanged]);

  useEffect(() => {
    if (justCompletedLabelId === null) return;
    const timer = window.setTimeout(() => setJustCompletedLabelId(null), 4000);
    return () => window.clearTimeout(timer);
  }, [justCompletedLabelId]);

  // A failed response may follow a committed write. Refresh instead of replaying an add/undo.
  const refreshState = useCallback(async () => {
    const fresh = await getSessionStateAction();
    setRunning(fresh.activeSession);
    setNowMs(now());
    completionAttempt.current = null;
    applySnapshot(fresh);
    onXpMightHaveChanged?.();
  }, [applySnapshot, onXpMightHaveChanged]);

  // Reconcile another tab's start/abandon/finish when returning to this tab.
  useEffect(() => {
    async function refresh() {
      if (document.visibilityState !== "visible" || busy.current) return;
      try {
        const fresh = await getSessionStateAction();
        if (busy.current) return;
        setRunning(fresh.activeSession);
        setNowMs(now());
        applySnapshot(fresh);
        onXpMightHaveChanged?.();
      } catch { setError("Could not refresh this tab. Check your connection."); }
    }
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [applySnapshot, onXpMightHaveChanged]);

  const start = useCallback(() => {
    if (running || selectedLabelId <= 0) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
    void perform(async () => {
      const session = await startSessionAction(selectedLabelId);
      setRunning(session);
      setNowMs(session.startedAt);
      completionAttempt.current = null;
    });
  }, [running, selectedLabelId, perform]);
  const abandon = useCallback(() => {
    if (!running) return;
    void perform(async () => {
      applySnapshot(await abandonSessionAction(running.id));
      setRunning(null);
    });
  }, [running, perform, applySnapshot]);
  const backfill = useCallback((labelId: number, count: number) => perform(async () => {
    applySnapshot(await backfillSessionsAction(labelId, count));
    onXpMightHaveChanged?.();
  }), [perform, applySnapshot, onXpMightHaveChanged]);
  const undoBackfill = useCallback((labelId: number) => perform(async () => {
    applySnapshot(await undoLastManualSessionAction(labelId));
    onXpMightHaveChanged?.();
  }), [perform, applySnapshot, onXpMightHaveChanged]);

  return { selectedLabelId, setSelectedLabelId, running, nowMs, todaySessions, summaryLine, justCompletedLabelId, pending, error,
    retry: () => { void perform(refreshState); }, start, abandon, backfill, undoBackfill };
}
export { secondsRemaining };
