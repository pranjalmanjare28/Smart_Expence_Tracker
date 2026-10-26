function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
  
  if (process.env.NODE_ENV !== "test") {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "An unexpected internal server error occurred.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = errorHandler;
