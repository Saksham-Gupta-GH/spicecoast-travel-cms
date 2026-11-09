export const RESPONDABLE_QUOTE_STATUSES = ["Sent", "Changes Requested", "Declined"] as const;

export function canTravellerRespondToQuote(status: string) {
  return RESPONDABLE_QUOTE_STATUSES.includes(status as (typeof RESPONDABLE_QUOTE_STATUSES)[number]);
}

export function quoteResponseBlockReason(status: string) {
  if (status === "Accepted") return "This proposal has already been accepted. Contact your consultant to reopen it.";
  if (status === "Expired") return "This proposal has expired. Please contact your consultant.";
  if (status === "Draft") return "This proposal has not been sent for traveller review.";
  return "This proposal is not available for a traveller response.";
}
