import { allowMethods, parseJsonBody, sendError, validatePlayer, ValidationError } from "../../lib/api.js";
import { getDatabase } from "../../lib/database.js";
import { isAdminAuthenticated } from "../../lib/admin-session.js";

export default async function handler(request, response) {
  if (request.method !== "PUT" && request.method !== "DELETE") {
    return allowMethods(response, ["PUT", "DELETE"]);
  }

  try {
    if (!isAdminAuthenticated(request)) return sendError(response, 401, "Not signed in.");
    const id = request.query.id;
    if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return sendError(response, 400, "Invalid player ID.");
    }

    const sql = getDatabase();
    if (request.method === "DELETE") {
      const deleted = await sql`DELETE FROM players WHERE id = ${id} RETURNING id`;
      if (deleted.length === 0) return sendError(response, 404, "Player not found.");
      return response.status(200).json({ deleted: true });
    }

    const player = validatePlayer(parseJsonBody(request));
    const [updatedPlayer] = await sql`
      UPDATE players
      SET name = ${player.name}, email = ${player.email}, phone = ${player.phone},
          position = ${player.position}, age = ${player.age}, message = ${player.message}
      WHERE id = ${id}
      RETURNING id, name, email, phone, position, age, message, created_at AS "createdAt"
    `;
    if (!updatedPlayer) return sendError(response, 404, "Player not found.");
    return response.status(200).json({ player: updatedPlayer });
  } catch (error) {
    if (error instanceof ValidationError) {
      return sendError(response, 400, error.message);
    }
    console.error("Could not update player record:", error);
    return sendError(response, 500, "Player record could not be updated.");
  }
}
