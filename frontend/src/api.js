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

    updateChatbot: (chatbotId, chatbot) =>
        apiRequest(`/chatbots/${chatbotId}`, {
            method: "PUT",
            body: JSON.stringify(chatbot),
        }),

    getPublicChatbot: (chatbotId) =>
        apiRequest(`/chatbots/public/${chatbotId}`),

    uploadDocument: (chatbotId, file) => {
        const formData = new FormData();
        formData.append("file", file);

        return apiRequest(`/documents/chatbots/${chatbotId}/upload`, {
            method: "POST",
            body: formData,
        });
    },

    getDocuments: (chatbotId) =>
        apiRequest(`/documents/chatbots/${chatbotId}`),

    deleteDocument: (documentId) =>
        apiRequest(`/documents/${documentId}`, {
            method: "DELETE",
        }),

    // CHAT WITH LANGUAGE SUPPORT
    sendMessage: (chatbotId, message, sessionId, language = "en") =>
        apiRequest(`/chat/${chatbotId}`, {
            method: "POST",
            body: JSON.stringify({
                message,
                session_id: sessionId,
                language,
            }),
        }),

    getAnalytics: () =>
        apiRequest("/analytics/"),

    // CONVERSATION HISTORY
    getConversations: () =>
        apiRequest("/conversations/"),

    getConversationDetails: (conversationId) =>
        apiRequest(`/conversations/${conversationId}`),

    // SMART LEAD GENERATION
    createLead: (leadData) =>
        apiRequest("/leads/", {
            method: "POST",
            body: JSON.stringify(leadData),
        }),

    getLeads: () =>
        apiRequest("/leads/"),

    updateLeadStatus: (leadId, status) =>
        apiRequest(`/leads/${leadId}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        }),
};