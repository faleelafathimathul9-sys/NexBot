import { useEffect, useState } from "react";
import ChatWidget from "./ChatWidget";
import "./FloatingChatWidget.css";

function FloatingChatWidget({
    chatbotId,
    chatbotName,
    welcomeMessage,
    themeColor = "#173D32"
}) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        function notifyParent() {
            if (window.parent === window) return;

            window.parent.postMessage(
                {
                    type: "NEXBOT_RESIZE",
                    width: isOpen ? 420 : 90,
                    height: isOpen ? 650 : 90
                },
                "*"
            );
        }

        const timer = setTimeout(notifyParent, 100);

        return () => clearTimeout(timer);
    }, [isOpen]);

    return (
        <div className="floating-chat-wrapper">

            {isOpen && (
                <div className="floating-chat-window">

                    <div
                        className="floating-chat-header"
                        style={{ backgroundColor: themeColor }}
                    >
                        <div>
                            <h3>{chatbotName}</h3>
                            <span>Powered by NexBot</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                        >
                            ×
                        </button>
                    </div>

                    <div className="floating-chat-body">
                        <ChatWidget
                            chatbotId={chatbotId}
                            chatbotName={chatbotName}
                            welcomeMessage={welcomeMessage}
                            themeColor={themeColor}
                        />
                    </div>

                </div>
            )}

            <button
                type="button"
                className="floating-chat-button"
                onClick={() => setIsOpen(!isOpen)}
                style={{ backgroundColor: themeColor }}
                aria-label={isOpen ? "Close chat" : "Open chat"}
            >
                {isOpen ? "×" : "💬"}
            </button>

        </div>
    );
}

export default FloatingChatWidget;