"use client";

import { useEffect, useRef, type ReactNode } from "react";

const INTERACTIVE = "input, textarea, select, button, a, [contenteditable], [role=slider], [data-no-swipe]";
const isInteractive = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest(INTERACTIVE));

/** Both panels stay mounted: swiping never resets the timer or journal draft. */
export function TodayPager({ children, page, onPageChange, disabled = false }: {
  children: [ReactNode, ReactNode]; page: number; onPageChange: (page: number) => void; disabled?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; id: number } | null>(null);

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo({ left: page * node.clientWidth, behavior: reduce ? "instant" : "smooth" });
  }, [page]);

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    // Keep the current panel aligned after a resize, without recreating its children.
    const resize = new ResizeObserver(() => node.scrollTo({ left: page * node.clientWidth, behavior: "instant" }));
    resize.observe(node);
    return () => resize.disconnect();
  }, [page]);

  function finishDrag() {
    const node = viewport.current;
    const start = drag.current;
    if (!node || !start) return;
    const delta = node.scrollLeft - start.left;
    const destination = Math.abs(delta) > Math.min(100, node.clientWidth * .15)
      ? Math.max(0, Math.min(1, Math.round(start.left / node.clientWidth) + Math.sign(delta)))
      : Math.round(start.left / node.clientWidth);
    drag.current = null;
    if (node.hasPointerCapture(start.id)) node.releasePointerCapture(start.id);
    // Read drag distance before restoring snap; restoring it can immediately snap back.
    node.scrollTo({ left: destination * node.clientWidth, behavior: "instant" });
    node.classList.remove("is-dragging");
    onPageChange(destination);
  }

  return <div className="today-pager" ref={viewport} aria-label="Today and daily check-in" tabIndex={0}
    onScroll={(event) => {
      const node = event.currentTarget;
      if (drag.current || !node.clientWidth) return;
      const nearest = Math.round(node.scrollLeft / node.clientWidth);
      if (Math.abs(node.scrollLeft - nearest * node.clientWidth) < 2 && nearest !== page) onPageChange(nearest);
    }}
    onKeyDown={(event) => {
      if (disabled || isInteractive(event.target) || event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      onPageChange(event.key === "ArrowRight" ? 1 : 0);
    }}
    onPointerDown={(event) => {
      // Touch/trackpad use native scrolling. Mouse drag must not steal text selection or inputs.
      if (disabled || event.pointerType !== "mouse" || event.button !== 0 || isInteractive(event.target)) return;
      drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, id: event.pointerId };
    }}
    onPointerMove={(event) => {
      if (!drag.current) return;
      const delta = drag.current.x - event.clientX;
      if (Math.abs(delta) < 8 && !event.currentTarget.hasPointerCapture(event.pointerId)) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add("is-dragging");
      event.currentTarget.scrollLeft = drag.current.left + delta;
    }}
    onPointerUp={finishDrag} onPointerCancel={finishDrag}
    onPointerLeave={() => { if (drag.current && !viewport.current?.hasPointerCapture(drag.current.id)) drag.current = null; }}
  >
    {children.map((child, index) => <div key={index} className="today-panel" inert={page !== index || disabled} aria-hidden={page !== index || disabled}>{child}</div>)}
  </div>;
}
