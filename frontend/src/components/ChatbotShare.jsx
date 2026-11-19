import { useEffect, useState } from "react";
import { API } from "../api";

const colors = [
    "#173D32",
    "#2563EB",
    "#7C3AED",
    "#DB2777",
    "#EA580C",
    "#0F766E",
    "#374151",
    "#B45309"
];

function ChatbotShare({ chatbotId, onSaved }) {
    const [chatbot, setChatbot] = useState(null);
    const [themeColor, setThemeColor] = useState("#173D32");
    const [welcomeMessage, setWelcomeMessage] = useState(
        "Hello! How can I help you today?"
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState("");
    const [message, setMessage] = useState("");

    const publicLink =
        `${window.location.origin}/chat/${chatbotId}`;

    const embedLink = `${publicLink}?embed=1`;

    const iframeId = `nexbot-chat-${chatbotId}`;

    const embedCode = `<iframe
    id="${iframeId}"
    src="${embedLink}"
    title="NexBot Chat Assistant"
    style="position:fixed;bottom:0;right:0;width:90px;height:90px;border:0;background:transparent;z-index:999999;"
></iframe>

<script>
(function() {
    const iframe = document.getElementById("${iframeId}");
    const trustedOrigin = "${new URL(embedLink).origin}";

    window.addEventListener("message", function(event) {
        if (
            event.origin !== trustedOrigin ||
            event.source !== iframe.contentWindow ||
            !event.data ||
            event.data.type !== "NEXBOT_RESIZE"
        ) {
            return;
        }

        iframe.style.width = event.data.width + "px";
        iframe.style.height = event.data.height + "px";
    });
})();
</script>`;

    useEffect(() => {
        async function loadChatbot() {
            try {
                const result = await API.getChatbots();

                const bots = Array.isArray(result)
                    ? result
                    : result.chatbots || [];

                const found = bots.find(
                    bot => Number(bot.id) === Number(chatbotId)
                );

                if (found) {
                    setChatbot(found);
                    setThemeColor(found.theme_color || "#173D32");
                    setWelcomeMessage(
                        found.welcome_message ||
                        "Hello! How can I help you today?"
                    );
                } else {
                    setMessage("Chatbot not found.");
                }
            } catch (error) {
                setMessage(error.message || "Unable to load chatbot.");
            } finally {
                setLoading(false);
            }
        }

        loadChatbot();
    }, [chatbotId]);

    async function saveAppearance() {
        setSaving(true);
        setMessage("");

        try {
            const result = await API.updateChatbot(chatbotId, {
                theme_color: themeColor,
                welcome_message: welcomeMessage
            });

            const updatedBot = result.chatbot || result;

            setChatbot(updatedBot);

            if (onSaved) {
                onSaved(updatedBot);
            }

            setMessage("Appearance saved successfully!");
        } catch (error) {
            setMessage(error.message || "Unable to save changes.");
        } finally {
            setSaving(false);
        }
    }

    async function copyText(text, type) {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);

            setTimeout(() => setCopied(""), 2000);
        } catch {
            setCopied("failed");
        }
    }

    if (loading) {
        return <div>Loading chatbot customisation...</div>;
    }

    if (!chatbot) {
        return <div>{message || "Chatbot unavailable."}</div>;
    }

    return (
        <div style={styles.container}>
            <h3 style={styles.heading}>Customise & Share Assistant</h3>

            <p style={styles.subtitle}>
                Personalise your chatbot and connect it to your website.
            </p>

            <div style={styles.section}>
                <h4>Chatbot Theme Colour</h4>

                <div style={styles.colorRow}>
                    {colors.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setThemeColor(color)}
                            title={color}
                            style={{
                                ...styles.colorButton,
                                backgroundColor: color,
                                outline: themeColor === color
                                    ? "3px solid #111827"
                                    : "none"
                            }}
                        />
                    ))}
                </div>

                <div style={styles.customColorRow}>
                    <label htmlFor={`custom-color-${chatbotId}`}>
                        Choose your own colour:
                    </label>

                    <input
                        id={`custom-color-${chatbotId}`}
                        type="color"
                        value={themeColor}
                        onChange={event =>
                            setThemeColor(event.target.value)
                        }
                    />

                    <span>{themeColor}</span>
                </div>
            </div>

            <div style={styles.section}>
                <h4>Welcome Message</h4>

                <textarea
                    value={welcomeMessage}
                    maxLength={500}
                    rows={3}
                    onChange={event =>
                        setWelcomeMessage(event.target.value)
                    }
                    style={styles.textarea}
                    placeholder="Write your chatbot's welcome message..."
                />
            </div>

            <div style={styles.section}>
                <h4>Live Preview</h4>

                <div style={styles.preview}>
                    <div
                        style={{
                            ...styles.previewHeader,
                            backgroundColor: themeColor
                        }}
                    >
                        <span>{chatbot.name}</span>
                        <span>● Online</span>
                    </div>

                    <div style={styles.previewBody}>
                        <div style={styles.previewBubble}>
                            {welcomeMessage ||
                                "Your welcome message will appear here."}
                        </div>

                        <div style={styles.previewInput}>
                            Type your message...
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={saveAppearance}
                disabled={saving}
                style={{
                    ...styles.saveButton,
                    backgroundColor: themeColor,
                    opacity: saving ? 0.7 : 1
                }}
            >
                {saving ? "Saving..." : "Save Appearance"}
            </button>

            {message && (
                <p style={styles.statusMessage}>{message}</p>
            )}

            <div style={styles.section}>
                <h4>Public Chatbot Link</h4>

                <div style={styles.shareField}>
                    <input
                        value={publicLink}
                        readOnly
                        style={styles.input}
                    />

                    <button
                        type="button"
                        onClick={() => copyText(publicLink, "link")}
                        style={styles.copyButton}
                    >
                        {copied === "link" ? "Copied!" : "Copy Link"}
                    </button>
                </div>

                <p style={styles.helpText}>
                    Share this link with your customers so they can chat
                    directly with your assistant.
                </p>
            </div>

            <div style={styles.section}>
                <h4>Website Embed Code</h4>

                <textarea
                    value={embedCode}
                    readOnly
                    rows={12}
                    style={styles.codeArea}
                />

                <button
                    type="button"
                    onClick={() => copyText(embedCode, "embed")}
                    style={styles.copyButton}
                >
                    {copied === "embed"
                        ? "Copied!"
                        : "Copy Embed Code"}
                </button>

                <p style={styles.helpText}>
                    Paste this code into your website's HTML to add the
                    NexBot assistant.
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: "22px",
        marginTop: "20px",
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "14px",
        color: "#1F2937"
    },
    heading: {
        fontSize: "19px",
        margin: "0 0 6px"
    },
    subtitle: {
        color: "#6B7280",
        fontSize: "13px",
        marginBottom: "22px"
    },
    section: {
        marginBottom: "22px"
    },
    colorRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "12px"
    },
    colorButton: {
        width: "32px",
        height: "32px",
        border: "2px solid white",
        borderRadius: "50%",
        cursor: "pointer"
    },
    customColorRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginTop: "15px",
        fontSize: "13px",
        flexWrap: "wrap"
    },
    textarea: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        border: "1px solid #D1D5DB",
        borderRadius: "8px",
        marginTop: "10px",
        font: "inherit",
        resize: "vertical"
    },
    preview: {
        maxWidth: "350px",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        overflow: "hidden",
        marginTop: "12px"
    },
    previewHeader: {
        padding: "14px",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        fontWeight: "600",
        fontSize: "13px"
    },
    previewBody: {
        background: "#F9FAFB",
        padding: "15px",
        minHeight: "100px"
    },
    previewBubble: {
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: "10px",
        padding: "12px",
        fontSize: "13px",
        maxWidth: "90%"
    },
    previewInput: {
        marginTop: "18px",
        padding: "10px",
        border: "1px solid #E5E7EB",
        borderRadius: "20px",
        background: "white",
        color: "#9CA3AF",
        fontSize: "12px"
    },
    saveButton: {
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "12px 20px",
        cursor: "pointer",
        fontWeight: "600",
        marginBottom: "15px"
    },
    statusMessage: {
        fontSize: "13px",
        color: "#166534"
    },
    shareField: {
        display: "flex",
        gap: "8px",
        marginTop: "10px",
        flexWrap: "wrap"
    },
    input: {
        flex: 1,
        minWidth: 0,
        padding: "10px",
        border: "1px solid #D1D5DB",
        borderRadius: "7px"
    },
    copyButton: {
        background: "#173D32",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "7px",
        cursor: "pointer"
    },
    codeArea: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        border: "1px solid #D1D5DB",
        borderRadius: "8px",
        marginTop: "10px",
        fontFamily: "monospace",
        fontSize: "12px",
        resize: "vertical"
    },
    helpText: {
        color: "#6B7280",
        fontSize: "12px",
        lineHeight: 1.5
    }
};

export default ChatbotShare;