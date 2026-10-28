import { allowMethods, parseJsonBody, sendError, validatePlayer, ValidationError } from "../lib/api.js";
import { getDatabase } from "../lib/database.js";
import { isAdminAuthenticated } from "../lib/admin-session.js";

export default async function handler(request, response) {
  if (request.method === "GET") {
    try {
      if (!isAdminAuthenticated(request)) return sendError(response, 401, "Not signed in.");
      const sql = getDatabase();
      const players = await sql`
        SELECT id, name, email, phone, position, age, message, created_at AS "createdAt"
        FROM players
        ORDER BY created_at DESC
      `;
      return response.status(200).json({ players });
    } catch (error) {
      console.error("Could not load player registrations:", error);
      return sendError(response, 500, "Player records could not be loaded.");
    }
  }

  if (request.method === "POST") {
    try {
      const player = validatePlayer(parseJsonBody(request));
      const sql = getDatabase();
      const [createdPlayer] = await sql`
        INSERT INTO players (name, email, phone, position, age, message)
        VALUES (${player.name}, ${player.email}, ${player.phone}, ${player.position}, ${player.age}, ${player.message})
        RETURNING id, name, email, phone, position, age, message, created_at AS "createdAt"
      `;
      return response.status(201).json({ player: createdPlayer });
    } catch (error) {
      if (error instanceof ValidationError) {
        return sendError(response, 400, error.message);
      }
      console.error("Could not save player registration:", error);
      return sendError(response, 500, "Player registration could not be saved.");
    }
  }

  return allowMethods(response, ["GET", "POST"]);
}
