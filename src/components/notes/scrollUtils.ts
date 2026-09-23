/**
 * Smoothly scrolls an element to a target scrollTop with cubic ease-in-out easing.
 * Returns a cancel function that aborts the animation if called.
 */
export const smoothScrollElement = (
  element: HTMLElement,
  targetTop: number,
  duration = 450,
  onComplete?: () => void
): (() => void) => {
  const startTop = element.scrollTop;
  const distance = targetTop - startTop;
  if (Math.abs(distance) < 2) {
    if (onComplete) onComplete();
    return () => {};
  }
  const startTime = performance.now();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let frameId: number;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    element.scrollTop = startTop + distance * eased;

    if (progress < 1) {
      frameId = requestAnimationFrame(step);
    } else {
      element.scrollTop = targetTop;
      if (onComplete) onComplete();
    }
  };

  frameId = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frameId);
};

