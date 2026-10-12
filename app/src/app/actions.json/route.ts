import { ACTIONS_CORS_HEADERS, type ActionsJson } from "@solana/actions";

/** Solana Actions routing: maps shareable page URLs to Action API endpoints. */
export function GET() {
  const payload: ActionsJson = {
    rules: [
      { pathPattern: "/go/*", apiPath: "/api/actions/go/*" },
      { pathPattern: "/api/actions/**", apiPath: "/api/actions/**" },
    ],
  };
  return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
}

export const OPTIONS = GET;
