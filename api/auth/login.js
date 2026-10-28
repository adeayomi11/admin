import { allowMethods, parseJsonBody, sendError, ValidationError } from "../../lib/api.js";
import { checkAdminCredentials, setAdminSession } from "../../lib/admin-session.js";

export default function handler(request, response) {
  if (request.method !== "POST") return allowMethods(response, ["POST"]);

  try {
    const { username, password } = parseJsonBody(request);
    if (!checkAdminCredentials(username, password)) {
      return sendError(response, 401, "That username or password doesn’t match. Please try again.");
    }
    setAdminSession(response);
    return response.status(200).json({ authenticated: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return sendError(response, 400, error.message);
    }
    console.error("Admin login failed:", error);
    return sendError(response, 500, "Admin sign-in is temporarily unavailable.");
  }
}
