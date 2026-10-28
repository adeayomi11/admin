import { allowMethods } from "../../lib/api.js";
import { clearAdminSession } from "../../lib/admin-session.js";

export default function handler(request, response) {
  if (request.method !== "POST") return allowMethods(response, ["POST"]);
  clearAdminSession(response);
  return response.status(200).json({ authenticated: false });
}
