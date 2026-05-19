export class AuthError extends Error {
  constructor(message = "No autorizado") {
    super(message);
    this.name = "AuthError";
  }
}
