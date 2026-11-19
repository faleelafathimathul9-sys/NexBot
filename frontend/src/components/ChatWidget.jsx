import { useState } from "react";
import { API } from "../api";

function ChatWidget({ chatbotId, chatbotName, welcomeMessage }) {

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: welcomeMessage || "Hello! How can I help you today?"
        }
    ]);

    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSend(e) {
        e.preventDefault();

        if (!input.trim() || loading) return;

        const question = input.trim();

        setMessages(previous => [
            ...previous,
            { role: "user", content: question }
        ]);

        setInput("");
        setLoading(true);

        try {
            const result = await API.sendMessage(
                chatbotId,
                question,
                sessionId
            );

            setSessionId(result.session_id);

            setMessages(previous => [
                ...previous,
                {
                    role: "assistant",
                    content: result.answer
                }
            ]);

        } catch (error) {

            setMessages(previous => [
                ...previous,
                {
                    role: "assistant",
                    content: error.message
                }
            ]);

        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="chat-widget">

            <div className="chat-header">
                <div>
                    <h3>{chatbotName}</h3>
                    <span>AI Assistant</span>
                </div>

                <span className="online-status">
                    ● Online
                </span>
            </div>

            <div className="chat-messages">

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`chat-message ${message.role}`}
                    >
                        {message.content}
                    </div>
                ))}

                {loading && (
                    <div className="chat-message assistant">
                        Thinking...
                    </div>
                )}

            </div>

            <form className="chat-input-area" onSubmit={handleSend}>

                <input
                    type="text"
                    placeholder="Ask something..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />

                <button type="submit" disabled={loading}>
                    Send
                </button>

            </form>

        </div>
    );
}

export default ChatWidget;