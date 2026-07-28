import axios from "axios";
import { toApiError } from "./api-error";
import { unwrapApiResponse } from "./api-response";
import { api } from "./axios";

async function request(config) {
  try {
    const response = await api.request(config);

    return unwrapApiResponse(response.data);
  } catch (error) {
    handleRequestError(error);
  }
}

const apiClient = {
  get(url, config = {}) {
    return request({ ...config, method: "get", url });
  },
  post(url, data, config = {}) {
    return request({ ...config, method: "post", url, data });
  },
  put(url, data, config = {}) {
    return request({ ...config, method: "put", url, data });
  },
  patch(url, data, config = {}) {
    return request({ ...config, method: "patch", url, data });
  },
  delete(url, config = {}) {
    return request({ ...config, method: "delete", url });
  },
};

function handleRequestError(error) {
  if (!axios.isAxiosError(error)) {
    throw toApiError(error);
  }

  if (!error.response) {
    throw toApiError({
      code: error.code ?? "NETWORK_ERROR",
      message:
        error.code === "ECONNABORTED"
          ? "The request timed out. Please try again."
          : "Unable to reach the server. Please check your connection.",
    });
  }

  const payload = error.response.data;

  throw toApiError({
    code: payload?.code,
    status: error.response.status,
    message: payload?.message ?? error.message,
    errors: payload?.errors,
  });
}

export default apiClient;
