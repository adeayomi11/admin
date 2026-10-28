import { allowMethods, sendError } from "../../lib/api.js";
import { isAdminAuthenticated } from "../../lib/admin-session.js";

export default function handler(request, response) {
  if (request.method !== "GET") return allowMethods(response, ["GET"]);
  try {
    if (!isAdminAuthenticated(request)) return sendError(response, 401, "Not signed in.");
    return response.status(200).json({ authenticated: true });
  } catch (error) {
    console.error("Admin session check failed:", error);
    return sendError(response, 500, "Admin session could not be verified.");
  }
}
