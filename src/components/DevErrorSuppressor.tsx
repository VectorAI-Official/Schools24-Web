"use client"

import { useEffect } from "react"

/**
 * Suppresses a known Next.js 16 devtools bug where the draggable dev-overlay
 * calls `releasePointerCapture` after the pointer ID has already expired.
 *
 * Root cause: `next/dist/next-devtools/draggable.tsx` calls
 * `element.releasePointerCapture(pointerId)` inside a pointerup/pointermove
 * handler but the browser already dropped the active pointer (e.g. fast click
 * or the element lost focus). This throws a `NotFoundError` that is harmless
 * (the drag already ended) but pollutes the console in development.
 *
 * Fix: intercept both the global `error` event and the original
 * `releasePointerCapture` method to silently swallow this specific case.
 * This component renders nothing and is excluded from production bundles.
 *
 * Remove this component once Next.js ships a patch for the devtools bug.
 */
export function DevErrorSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    // 1. Suppress via window error event (catches synchronous throws)
    const handleWindowError = (event: ErrorEvent) => {
      if (
        event.error instanceof DOMException &&
        event.error.name === "NotFoundError" &&
        typeof event.message === "string" &&
        event.message.includes("releasePointerCapture")
      ) {
        event.preventDefault() // prevent printing to console
        event.stopImmediatePropagation()
      }
    }
    window.addEventListener("error", handleWindowError, true)

    // 2. Patch releasePointerCapture on Element.prototype so the call
    //    inside the Next.js devtools draggable never even reaches the browser.
    const original = Element.prototype.releasePointerCapture
    Element.prototype.releasePointerCapture = function (pointerId: number) {
      try {
        original.call(this, pointerId)
      } catch (e) {
        if (e instanceof DOMException && e.name === "NotFoundError") {
          // Silently ignore – the pointer was already released by the browser.
          return
        }
        throw e
      }
    }

    return () => {
      window.removeEventListener("error", handleWindowError, true)
      Element.prototype.releasePointerCapture = original
    }
  }, [])

  return null
}
