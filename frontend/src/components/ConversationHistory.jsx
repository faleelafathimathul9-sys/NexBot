import { useEffect, useState } from "react";
import { API } from "../api";
import "./ConversationHistory.css";

function ConversationHistory() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState("");

    async function loadConversations() {
        setLoading(true);
        setError("");

        try {
            const result = await API.getConversations();
            setConversations(result.conversations || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function openConversation(conversationId) {
        setLoadingDetails(true);
        setSelectedConversation(null);

        try {
            const result = await API.getConversationDetails(conversationId);
            setSelectedConversation(result.conversation);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingDetails(false);
        }
    }

    useEffect(() => {
        loadConversations();
    }, []);

    function formatDate(date) {
        if (!date) return "Date unavailable";

        return new Date(date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    }

    return (
        <section className="conversation-history">

            <div className="conversation-heading">
                <div>
                    <h2>Conversation History</h2>
                    <p>View and manage customer interactions with your assistants.</p>
                </div>

                <button onClick={loadConversations}>
                    Refresh
                </button>
            </div>

            {error && (
                <div className="conversation-error">
                    {error}
                </div>
            )}

            <div className="conversation-layout">

                <div className="conversation-list-panel">

                    <h3>Recent Conversations</h3>

                    {loading ? (
                        <p>Loading conversations...</p>
                    ) : conversations.length === 0 ? (
                        <p className="conversation-empty">
                            No conversations available yet.
                        </p>
                    ) : (
                        conversations.map(conversation => (
                            <button
                                className={`conversation-list-item ${
                                    selectedConversation?.id === conversation.id
                                        ? "conversation-selected"
                                        : ""
                                }`}
                                key={conversation.id}
                                onClick={() =>
                                    openConversation(conversation.id)
                                }
                            >
                                <div className="conversation-avatar">
                                    {conversation.visitor_name
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="conversation-list-info">
                                    <h4>{conversation.visitor_name}</h4>

                                    <p>{conversation.chatbot_name}</p>

                                    <span>
                                        {formatDate(conversation.started_at)}
                                    </span>
                                </div>

                                <span className="conversation-count">
                                    {conversation.message_count}
                                </span>
                            </button>
                        ))
                    )}

                </div>

                <div className="conversation-detail-panel">

                    {!selectedConversation && !loadingDetails && (
                        <div className="conversation-placeholder">
                            <div>💬</div>
                            <h3>Select a conversation</h3>
                            <p>
                                Choose a conversation to view its messages.
                            </p>
                        </div>
                    )}

                    {loadingDetails && (
                        <p className="conversation-placeholder">
                            Loading messages...
                        </p>
                    )}

                    {selectedConversation && (
                        <>
                            <div className="conversation-detail-header">
                                <div>
                                    <h3>
                                        {selectedConversation.visitor_name}
                                    </h3>

                                    <p>
                                        Assistant: {selectedConversation.chatbot_name}
                                    </p>
                                </div>

                                <span>
                                    {formatDate(selectedConversation.started_at)}
                                </span>
                            </div>

                            <div className="conversation-messages">

                                {selectedConversation.messages.map(message => (
                                    <div
                                        key={message.id}
                                        className={`conversation-message ${
                                            message.role === "user"
                                                ? "customer-message"
                                                : "assistant-message"
                                        }`}
                                    >
                                        <span className="message-role">
                                            {message.role === "user"
                                                ? "Customer"
                                                : "AI Assistant"}
                                        </span>

                                        <p>{message.content}</p>

                                        <small>
                                            {formatDate(message.created_at)}
                                        </small>
                                    </div>
                                ))}

                            </div>
                        </>
                    )}

                </div>

            </div>

        </section>
    );
}

export default ConversationHistory;