export const isModifiedEvent = (event) => {
  return !!(
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  );
};

export const handleLandingNavigation = (event, targetPath) => {
  if (!event) {
    return false;
  }

  if (event.defaultPrevented || isModifiedEvent(event)) {
    return false;
  }

  if (typeof event.button === "number" && event.button !== 0) {
    return false;
  }

  if (typeof window === "undefined" || typeof targetPath !== "string") {
    return false;
  }

  event.preventDefault();

  try {
    window.history.pushState({}, "", targetPath);
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: window.history.state })
    );
    return true;
  } catch (error) {
    window.location.assign(targetPath);
    return true;
  }
};
