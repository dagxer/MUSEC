export async function apiFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      credentials: "include",
      ...options,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Cannot connect to the portal service. Check that the backend is running, then retry.",
    );
  }

  // 501 (not implemented) and 503 (the port didn't respond) come with a
  // message for the action's page to show.
  if (response.status >= 500 && ![501, 503].includes(response.status)) {
    const error = new Error(
      `The portal service returned an error (${response.status}). Check the backend, then retry.`,
    );
    error.status = response.status;
    throw error;
  }
  return response;
}
