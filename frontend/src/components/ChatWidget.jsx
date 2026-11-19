import { useState } from "react";
import { API } from "../api";
import "./ChatWidget.css";

function ChatWidget({
    chatbotId,
    chatbotName,
    welcomeMessage,
    themeColor = "#173D32"
}) {
    const [language, setLanguage] = useState("en");

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: welcomeMessage || "Hello! How can I help you today?"
        }
    ]);

    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Lead form states
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [leadName, setLeadName] = useState("");
    const [leadPhone, setLeadPhone] = useState("");
    const [leadEmail, setLeadEmail] = useState("");
    const [leadEnquiry, setLeadEnquiry] = useState("");
    const [leadConsent, setLeadConsent] = useState(false);
    const [leadLoading, setLeadLoading] = useState(false);
    const [leadMessage, setLeadMessage] = useState("");
    const [leadError, setLeadError] = useState("");

    const currentTheme = themeColor || "#173D32";

    function changeLanguage(newLanguage) {
        setLanguage(newLanguage);

        setMessages(previous => {
            const updated = [...previous];

            if (
                updated.length === 1 &&
                updated[0].role === "assistant"
            ) {
                updated[0] = {
                    role: "assistant",
                    content: newLanguage === "kn"
                        ? "ನಮಸ್ಕಾರ! ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?"
                        : (welcomeMessage || "Hello! How can I help you today?")
                };
            }

            return updated;
        });
    }

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
                sessionId,
                language
            );

            setSessionId(result.session_id);
            setConversationId(result.conversation_id);

            if (result.language) {
                setLanguage(result.language);
            }

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

    async function handleLeadSubmit(e) {
        e.preventDefault();

        setLeadError("");
        setLeadMessage("");

        if (!leadConsent) {
            setLeadError(
                "Please give your consent before sharing your details."
            );
            return;
        }

        setLeadLoading(true);

        try {
            await API.createLead({
                chatbot_id: Number(chatbotId),
                conversation_id: conversationId,
                customer_name: leadName.trim(),
                phone: leadPhone.trim(),
                email: leadEmail.trim(),
                enquiry: leadEnquiry.trim(),
                consent_given: true
            });

            setLeadMessage(
                language === "kn"
                    ? "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ."
                    : "Thank you! Your details have been submitted successfully."
            );

            setLeadName("");
            setLeadPhone("");
            setLeadEmail("");
            setLeadEnquiry("");
            setLeadConsent(false);

        } catch (error) {
            setLeadError(error.message);
        } finally {
            setLeadLoading(false);
        }
    }

    return (
        <div
            className="chat-widget"
            style={{
                "--chat-theme": currentTheme
            }}
        >

            {/* CHAT HEADER */}
            <div className="chat-header">
                <div>
                    <h3>{chatbotName}</h3>
                    <span>AI Assistant</span>
                </div>

                <span className="online-status">
                    ● Online
                </span>
            </div>

            {/* LANGUAGE SELECTOR */}
            <div className="chat-language-selector">
                <span>
                    {language === "kn" ? "ಭಾಷೆ:" : "Language:"}
                </span>

                <button
                    type="button"
                    className={language === "en" ? "active" : ""}
                    onClick={() => changeLanguage("en")}
                >
                    English
                </button>

                <button
                    type="button"
                    className={language === "kn" ? "active" : ""}
                    onClick={() => changeLanguage("kn")}
                >
                    ಕನ್ನಡ
                </button>
            </div>

            {/* CHAT MESSAGES */}
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
                        {language === "kn"
                            ? "ಉತ್ತರಿಸುತ್ತಿದೆ..."
                            : "Thinking..."}
                    </div>
                )}

                {/* LEAD ACTION */}
                <div className="chat-lead-action">
                    <button
                        type="button"
                        onClick={() => {
                            setShowLeadForm(!showLeadForm);
                            setLeadError("");
                            setLeadMessage("");
                        }}
                    >
                        {language === "kn"
                            ? "📞 ಕರೆಗಾಗಿ ವಿನಂತಿಸಿ"
                            : "📞 Request a Callback"}
                    </button>
                </div>

                {/* LEAD FORM */}
                {showLeadForm && (
                    <div className="chat-lead-form">

                        <h3>
                            {language === "kn"
                                ? "ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ"
                                : "Request a Callback"}
                        </h3>

                        <p>
                            {language === "kn"
                                ? "ನಮ್ಮ ತಂಡವು ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ."
                                : "Share your details and the business can contact you."}
                        </p>

                        <form onSubmit={handleLeadSubmit}>

                            <label>
                                {language === "kn" ? "ಪೂರ್ಣ ಹೆಸರು" : "Full Name"}

                                <input
                                    type="text"
                                    value={leadName}
                                    onChange={e => setLeadName(e.target.value)}
                                    placeholder="Your name"
                                    maxLength={120}
                                    required
                                />
                            </label>

                            <label>
                                {language === "kn" ? "ಫೋನ್ ಸಂಖ್ಯೆ" : "Phone Number"}

                                <input
                                    type="tel"
                                    value={leadPhone}
                                    onChange={e => setLeadPhone(e.target.value)}
                                    placeholder="Your phone number"
                                    maxLength={20}
                                    required
                                />
                            </label>

                            <label>
                                {language === "kn" ? "ಇಮೇಲ್ (ಐಚ್ಛಿಕ)" : "Email (Optional)"}

                                <input
                                    type="email"
                                    value={leadEmail}
                                    onChange={e => setLeadEmail(e.target.value)}
                                    placeholder="Your email address"
                                />
                            </label>

                            <label>
                                {language === "kn" ? "ನಿಮ್ಮ ವಿಚಾರಣೆ" : "What are you interested in?"}

                                <textarea
                                    value={leadEnquiry}
                                    onChange={e => setLeadEnquiry(e.target.value)}
                                    placeholder="Tell us how we can help..."
                                    maxLength={3000}
                                    required
                                    rows={3}
                                />
                            </label>

                            <label className="lead-consent">
                                <input
                                    type="checkbox"
                                    checked={leadConsent}
                                    onChange={e => setLeadConsent(e.target.checked)}
                                />

                                <span>
                                    {language === "kn"
                                        ? "ನನ್ನ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ಮತ್ತು ಈ ವ್ಯವಹಾರವು ನನ್ನನ್ನು ಸಂಪರ್ಕಿಸಲು ನಾನು ಒಪ್ಪುತ್ತೇನೆ."
                                        : "I agree to share my details and allow this business to contact me about my enquiry."}
                                </span>
                            </label>

                            {leadError && (
                                <div className="lead-error">
                                    {leadError}
                                </div>
                            )}

                            {leadMessage && (
                                <div className="lead-success">
                                    {leadMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={leadLoading}
                                className="lead-submit-button"
                            >
                                {leadLoading
                                    ? "Submitting..."
                                    : language === "kn"
                                        ? "ವಿವರಗಳನ್ನು ಕಳುಹಿಸಿ"
                                        : "Submit Details"}
                            </button>

                        </form>
                    </div>
                )}

            </div>

            {/* MESSAGE INPUT */}
            <form className="chat-input-area" onSubmit={handleSend}>

                <input
                    type="text"
                    placeholder={
                        language === "kn"
                            ? "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ..."
                            : "Ask something..."
                    }
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading}
                />

                <button type="submit" disabled={loading || !input.trim()}>
                    {language === "kn" ? "ಕಳುಹಿಸಿ" : "Send"}
                </button>

            </form>

        </div>
    );
}

export default ChatWidget;