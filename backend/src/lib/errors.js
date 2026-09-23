export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;
  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
}
