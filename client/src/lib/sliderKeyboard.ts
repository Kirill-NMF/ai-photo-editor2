const clampSliderPosition = (position: number) => Math.min(100, Math.max(0, position));

export function getSliderPositionFromKey(
  currentPosition: number,
  key: string,
  step = 5,
) {
  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      return clampSliderPosition(currentPosition - step);
    case "ArrowRight":
    case "ArrowUp":
      return clampSliderPosition(currentPosition + step);
    case "Home":
      return 0;
    case "End":
      return 100;
    default:
      return currentPosition;
  }
}
