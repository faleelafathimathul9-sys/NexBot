const API_BASE_URL = "http://127.0.0.1:5000/api";

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("nexbot_token");

    const headers = {
        ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
}

export const API = {

    register: (user) =>
        apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify(user),
        }),

    login: (credentials) =>
        apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        }),

    getBusinesses: () =>
        apiRequest("/business/"),

    createBusiness: (business) =>
        apiRequest("/business/", {
            method: "POST",
            body: JSON.stringify(business),
        }),

    getChatbots: () =>
        apiRequest("/chatbots/"),

    createChatbot: (chatbot) =>
        apiRequest("/chatbots/", {
            method: "POST",
            body: JSON.stringify(chatbot),
        }),

    uploadDocument: (chatbotId, file) => {
        const formData = new FormData();
        formData.append("file", file);

        return apiRequest(`/documents/chatbots/${chatbotId}/upload`, {
            method: "POST",
            body: formData,
        });
    },

    sendMessage: (chatbotId, message, sessionId) =>
        apiRequest(`/chat/${chatbotId}`, {
            method: "POST",
            body: JSON.stringify({
                message,
                session_id: sessionId,
            }),
        }),
};