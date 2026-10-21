const GUIDE =
  "https://github.com/jmcpartland/forms-connector/blob/main/docs/BRING-YOUR-OWN-CLIENT.md";

/** Turn a Forms API error response into a message that tells the user what to do. */
export function formatFormsError(status: number, data: any): string {
  const message: string = data?.error?.message ?? JSON.stringify(data);
  const reasons: string[] = (data?.error?.errors ?? []).map((e: any) => e?.reason);
  const details: string[] = (data?.error?.details ?? []).map((d: any) => d?.reason);

  if (
    status === 403 &&
    ([...reasons, ...details].includes("accessNotConfigured") ||
      [...details].includes("SERVICE_DISABLED") ||
      /has not been used|is disabled/i.test(message))
  ) {
    return (
      "The Google Forms API is not enabled in your Google Cloud project. " +
      "Enable it in the same project as your OAuth client (step 2 of the guide: " +
      `${GUIDE}), wait a minute, then try again.`
    );
  }
  if (status === 404) return `Forms API 404: form not found, or your Google account can't access it. ${message}`;
  return `Forms API ${status}: ${message}`;
}
