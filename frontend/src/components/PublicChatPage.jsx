import { useEffect, useState } from "react";
import { API } from "../api";
import ChatWidget from "./ChatWidget";
import FloatingChatWidget from "./FloatingChatWidget";

function PublicChatPage() {
    const [chatbot, setChatbot] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const isEmbed =
        new URLSearchParams(window.location.search).get("embed") === "1";

    useEffect(() => {
        const chatbotId = window.location.pathname.split("/").pop();

        API.getPublicChatbot(chatbotId)
            .then(result => setChatbot(result.chatbot))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div>Loading assistant...</div>;
    }

    if (error || !chatbot) {
        return <div>Assistant unavailable: {error}</div>;
    }

    const themeColor = chatbot.theme_color || "#173D32";

    if (isEmbed) {
        return (
            <FloatingChatWidget
                chatbotId={chatbot.id}
                chatbotName={chatbot.name}
                welcomeMessage={chatbot.welcome_message}
                themeColor={themeColor}
            />
        );
    }

    return (
        <div className="public-chat-page">
            <header
                className="public-chat-header"
                style={{ backgroundColor: themeColor }}
            >
                <h2>{chatbot.business_name}</h2>
                <p>Powered by NexBot</p>
            </header>

            <main className="public-chat-container">
                <h1>{chatbot.name}</h1>
                <p>{chatbot.description}</p>

                <ChatWidget
                    chatbotId={chatbot.id}
                    chatbotName={chatbot.name}
                    welcomeMessage={chatbot.welcome_message}
                    themeColor={themeColor}
                />
            </main>
        </div>
    );
}

export default PublicChatPage;