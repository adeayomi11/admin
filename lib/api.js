const positions = new Set([
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
  "Open to anything",
]);

export class ValidationError extends Error {}

export function parseJsonBody(request) {
  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      throw new ValidationError("Request body must be valid JSON.");
    }
  }
  if (request.body && typeof request.body === "object" && !Array.isArray(request.body)) {
    return request.body;
  }
  throw new ValidationError("Request body must be a JSON object.");
}

export function validatePlayer(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("Player details must be a JSON object.");
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const position = typeof input.position === "string" ? input.position.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const age = Number(input.age);

  if (!name || name.length > 120) throw new ValidationError("Name is required and must be 120 characters or fewer.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new ValidationError("Enter a valid email address.");
  }
  if (phone.length < 7 || phone.length > 40) throw new ValidationError("Enter a valid phone number.");
  if (!positions.has(position)) throw new ValidationError("Select a valid player position.");
  if (!Number.isInteger(age) || age < 5 || age > 99) {
    throw new ValidationError("Age must be a whole number from 5 to 99.");
  }
  if (message.length > 2000) throw new ValidationError("Player note must be 2,000 characters or fewer.");

  return { name, email, phone, position, age, message };
}

export function sendError(response, status, message) {
  return response.status(status).json({ error: message });
}

export function allowMethods(response, methods) {
  response.setHeader("Allow", methods.join(", "));
  return sendError(response, 405, "Method not allowed.");
}
