const serverResponse = {
  sendSuccess: (res, message, data = null) => {
    const statusCode = message.code || 200;

    const response = {
      code: statusCode,
      success: true,
      message: message.message,
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  },

  sendError: (res, message, error = null) => {
    const statusCode = message.code || 500;

    const response = {
      code: statusCode,
      success: false,
      message: message.message,
    };

    if (error) {
      console.error("API Error:", error);
    }

    return res.status(statusCode).json(response);
  },
};

module.exports = serverResponse;