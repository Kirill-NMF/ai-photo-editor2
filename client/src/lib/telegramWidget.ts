interface TelegramWidgetContainer {
  querySelector(selectors: string): unknown;
}

export function hasTelegramWidgetFrame(container: TelegramWidgetContainer) {
  return container.querySelector("iframe") !== null;
}
