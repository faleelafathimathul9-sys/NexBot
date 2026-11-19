import { useState, useEffect } from "react";
import { API } from "./api";
import ChatWidget from "./components/ChatWidget";
import PublicChatPage from "./components/PublicChatPage";
import ChatbotShare from "./components/ChatbotShare";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ConversationHistory from "./components/ConversationHistory";
import LeadManagement from "./components/LeadManagement";
import PricingPlans from "./components/PricingPlans";
import "./App.css";

function App() {
    const [token, setToken] = useState(localStorage.getItem("nexbot_token"));

    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const [businesses, setBusinesses] = useState([]);
    const [chatbots, setChatbots] = useState([]);

    const [businessName, setBusinessName] = useState("");
    const [industry, setIndustry] = useState("");
    const [botName, setBotName] = useState("");
    const [selectedBusiness, setSelectedBusiness] = useState("");

    const [selectedChatbot, setSelectedChatbot] = useState(null);
    const [knowledgeChatbot, setKnowledgeChatbot] = useState(null);

    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loadingDocuments, setLoadingDocuments] = useState(false);

    const [editingChatbot, setEditingChatbot] = useState(null);
    const [editBotName, setEditBotName] = useState("");
    const [editWelcomeMessage, setEditWelcomeMessage] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editActive, setEditActive] = useState(true);

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const [activeSection, setActiveSection] = useState("overview");

    const navigationItems = [
        { id: "overview", label: "Dashboard", icon: "▦" },
        { id: "assistants", label: "AI Assistants", icon: "✧" },
        { id: "knowledge", label: "Knowledge Base", icon: "▤" },
        { id: "analytics", label: "Analytics", icon: "▥" },
        { id: "conversations", label: "Conversation History", icon: "◷" },
        { id: "leads", label: "Leads", icon: "↗" },
        { id: "pricing", label: "Pricing Plans", icon: "◇" }
    ];

    function scrollToSection(sectionId) {
        setActiveSection(sectionId);

        const section = document.getElementById(sectionId);

        if (section) {
            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    // SIDEBAR SCROLL OBSERVER

    useEffect(() => {
        if (!token) return;

        const sectionIds = [
            "overview",
            "assistants",
            "knowledge",
            "analytics",
            "conversations",
            "leads",
            "pricing"
        ];

        const sections = sectionIds
            .map(id => document.getElementById(id))
            .filter(Boolean);

        if (!sections.length) return;

        const observer = new IntersectionObserver(
            entries => {
                const visibleSections = entries
                    .filter(entry => entry.isIntersecting)
                    .sort(
                        (a, b) =>
                            b.intersectionRatio - a.intersectionRatio
                    );

                if (visibleSections.length) {
                    setActiveSection(visibleSections[0].target.id);
                }
            },
            {
                root: null,
                rootMargin: "-15% 0px -65% 0px",
                threshold: [0, 0.1, 0.25, 0.5]
            }
        );

        sections.forEach(section => observer.observe(section));

        return () => observer.disconnect();
    }, [token, businesses.length, chatbots.length, knowledgeChatbot]);

    // LOGIN AND REGISTRATION

    async function handleAuth(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const result = mode === "login"
                ? await API.login({ email, password })
                : await API.register({ name, email, password });

            localStorage.setItem("nexbot_token", result.token);
            setToken(result.token);
            setMessage("Welcome to NexBot!");

        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    // LOAD DASHBOARD

    async function loadDashboard() {
        try {
            const businessData = await API.getBusinesses();
            const botData = await API.getChatbots();

            setBusinesses(
                Array.isArray(businessData)
                    ? businessData
                    : businessData.businesses || []
            );

            const loadedBots = Array.isArray(botData)
                ? botData
                : botData.chatbots || [];

            setChatbots(loadedBots);

            setSelectedChatbot(current => {
                if (!current) return current;

                return loadedBots.find(
                    bot => Number(bot.id) === Number(current.id)
                ) || current;
            });

        } catch (error) {
            setMessage(error.message);
        }
    }

    useEffect(() => {
        if (token && !window.location.pathname.startsWith("/chat/")) {
            loadDashboard();
        }
    }, [token]);

    // UPDATE CHATBOT AFTER APPEARANCE SAVE

    function handleAppearanceSaved(updatedBot) {
        if (!updatedBot) {
            loadDashboard();
            return;
        }

        setChatbots(current =>
            current.map(bot =>
                Number(bot.id) === Number(updatedBot.id)
                    ? { ...bot, ...updatedBot }
                    : bot
            )
        );

        setSelectedChatbot(current =>
            current && Number(current.id) === Number(updatedBot.id)
                ? { ...current, ...updatedBot }
                : current
        );
    }

    // CREATE BUSINESS

    async function createBusiness(e) {
        e.preventDefault();

        try {
            await API.createBusiness({
                name: businessName,
                industry: industry
            });

            setBusinessName("");
            setIndustry("");
            setMessage("Business created successfully!");

            await loadDashboard();

        } catch (error) {
            setMessage(error.message);
        }
    }

    // CREATE CHATBOT

    async function createChatbot(e) {
        e.preventDefault();

        try {
            await API.createChatbot({
                name: botName,
                business_id: Number(selectedBusiness)
            });

            setBotName("");
            setMessage("Chatbot created successfully!");

            await loadDashboard();

        } catch (error) {
            setMessage(error.message);
        }
    }

    // EDIT CHATBOT

    function openEditChatbot(bot) {
        setEditingChatbot(bot);
        setEditBotName(bot.name || "");

        setEditWelcomeMessage(
            bot.welcome_message ||
            "Hello! How can I help you today?"
        );

        setEditDescription(bot.description || "");
        setEditActive(bot.is_active ?? true);
    }

    async function updateChatbot(e) {
        e.preventDefault();

        try {
            await API.updateChatbot(editingChatbot.id, {
                name: editBotName,
                welcome_message: editWelcomeMessage,
                description: editDescription,
                is_active: editActive
            });

            setMessage("Assistant updated successfully!");
            setEditingChatbot(null);

            await loadDashboard();

        } catch (error) {
            setMessage(error.message);
        }
    }

    // KNOWLEDGE BASE

    async function openKnowledgeBase(bot) {
        setKnowledgeChatbot(bot);
        setDocuments([]);
        setLoadingDocuments(true);

        scrollToSection("knowledge");

        try {
            const result = await API.getDocuments(bot.id);
            setDocuments(result.documents || []);

        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoadingDocuments(false);
        }
    }

    async function refreshDocuments() {
        if (!knowledgeChatbot) return;

        setLoadingDocuments(true);

        try {
            const result = await API.getDocuments(knowledgeChatbot.id);
            setDocuments(result.documents || []);

        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoadingDocuments(false);
        }
    }

    // UPLOAD PDF DOCUMENTS

    async function uploadPDF(e, chatbotId) {
        const files = Array.from(e.target.files || []);

        if (!files.length) return;

        const invalidFiles = files.filter(
            file => !file.name.toLowerCase().endsWith(".pdf")
        );

        if (invalidFiles.length) {
            setMessage("Please select PDF files only.");
            e.target.value = "";
            return;
        }

        setUploading(true);
        setMessage(`Uploading ${files.length} document(s)...`);

        let successful = 0;
        const errors = [];

        try {
            for (const file of files) {
                try {
                    await API.uploadDocument(chatbotId, file);
                    successful++;
                } catch (error) {
                    errors.push(`${file.name}: ${error.message}`);
                }
            }

            if (knowledgeChatbot?.id === chatbotId) {
                await refreshDocuments();
            }

            if (errors.length) {
                setMessage(
                    `${successful} uploaded successfully. ${errors.length} failed: ${errors.join(" | ")}`
                );
            } else {
                setMessage(
                    `${successful} PDF document(s) uploaded successfully!`
                );
            }

        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    // DELETE PDF

    async function deletePDF(documentId) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this document? Its knowledge will also be removed from this chatbot."
        );

        if (!confirmed) return;

        try {
            await API.deleteDocument(documentId);

            setDocuments(current =>
                current.filter(document => document.id !== documentId)
            );

            setMessage("Document deleted successfully!");

        } catch (error) {
            setMessage(error.message);
        }
    }

    // LOGOUT

    function logout() {
        localStorage.removeItem("nexbot_token");

        setToken(null);
        setBusinesses([]);
        setChatbots([]);
        setSelectedChatbot(null);
        setKnowledgeChatbot(null);
        setDocuments([]);
        setEditingChatbot(null);
        setMessage("");
        setActiveSection("overview");
    }

    // PUBLIC CHATBOT PAGE

    if (window.location.pathname.startsWith("/chat/")) {
        return <PublicChatPage />;
    }

    // LOGIN SCREEN

    if (!token) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h1>NexBot<span>.</span></h1>
                    <p>Your business. Your AI assistant.</p>

                    <h2>
                        {mode === "login"
                            ? "Welcome back"
                            : "Create your account"}
                    </h2>

                    <form onSubmit={handleAuth}>
                        {mode === "register" && (
                            <input
                                placeholder="Full name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        )}

                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password (minimum 8 characters)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            minLength="8"
                            required
                        />

                        <button disabled={loading}>
                            {loading
                                ? "Please wait..."
                                : mode === "login"
                                    ? "Sign In"
                                    : "Create Account"}
                        </button>
                    </form>

                    <p className="switch-mode">
                        {mode === "login"
                            ? "New to NexBot?"
                            : "Already have an account?"}

                        <button
                            className="text-button"
                            onClick={() =>
                                setMode(
                                    mode === "login"
                                        ? "register"
                                        : "login"
                                )
                            }
                        >
                            {mode === "login"
                                ? "Create account"
                                : "Sign in"}
                        </button>
                    </p>

                    {message && (
                        <p className="notice">{message}</p>
                    )}
                </div>
            </div>
        );
    }

    // MAIN DASHBOARD

    return (
        <div className="dashboard">

            <aside className="sidebar">
                <h1>NexBot<span>.</span></h1>
                <p className="sidebar-label">WORKSPACE</p>

                <nav className="sidebar-nav">
                    {navigationItems.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            className={`sidebar-item ${
                                activeSection === item.id ? "active" : ""
                            }`}
                            onClick={() => scrollToSection(item.id)}
                            aria-current={
                                activeSection === item.id
                                    ? "location"
                                    : undefined
                            }
                        >
                            <span className="sidebar-icon">
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <button
                    className="logout-button"
                    onClick={logout}
                >
                    Sign Out
                </button>
            </aside>

            <main className="main-content">

                <header className="topbar">
                    <div>
                        <p className="eyebrow">YOUR WORKSPACE</p>
                        <h2>Dashboard</h2>
                    </div>

                    <button onClick={loadDashboard}>
                        Refresh
                    </button>
                </header>

                {/* OVERVIEW */}

                <section
                    id="overview"
                    className="welcome-section dashboard-section"
                >
                    <div>
                        <p className="eyebrow">WELCOME TO NEXBOT</p>

                        <h2>
                            Build smarter customer experiences.
                        </h2>

                        <p>
                            Create AI assistants for any industry,
                            trained using your own business information.
                        </p>
                    </div>
                </section>

                {/* STATISTICS */}

                <section className="stats-grid">
                    <div className="stat-card">
                        <p>Total Businesses</p>
                        <h2>{businesses.length}</h2>
                    </div>

                    <div className="stat-card">
                        <p>AI Assistants</p>
                        <h2>{chatbots.length}</h2>
                    </div>

                    <div className="stat-card">
                        <p>Knowledge Base</p>
                        <h2>PDF-Powered</h2>
                    </div>
                </section>

                {/* ANALYTICS */}

                <section
                    id="analytics"
                    className="dashboard-section"
                >
                    <AnalyticsDashboard />
                </section>

                {/* CONVERSATIONS */}

                <section
                    id="conversations"
                    className="dashboard-section"
                >
                    <ConversationHistory />
                </section>

                {/* AI ASSISTANTS */}

                <div
                    id="assistants"
                    className="dashboard-section"
                >
                    <section className="management-grid">

                        <div className="panel">
                            <h3>Create Business</h3>
                            <p>Add any type of business to NexBot.</p>

                            <form onSubmit={createBusiness}>
                                <input
                                    placeholder="Business name"
                                    value={businessName}
                                    onChange={e => setBusinessName(e.target.value)}
                                    required
                                />

                                <input
                                    placeholder="Industry (e.g. Fashion, Healthcare, Education)"
                                    value={industry}
                                    onChange={e => setIndustry(e.target.value)}
                                />

                                <button>Create Business</button>
                            </form>
                        </div>

                        <div className="panel">
                            <h3>Create AI Assistant</h3>
                            <p>Build an assistant for your business.</p>

                            <form onSubmit={createChatbot}>
                                <input
                                    placeholder="Assistant name"
                                    value={botName}
                                    onChange={e => setBotName(e.target.value)}
                                    required
                                />

                                <select
                                    value={selectedBusiness}
                                    onChange={e => setSelectedBusiness(e.target.value)}
                                    required
                                >
                                    <option value="">Select business</option>

                                    {businesses.map(business => (
                                        <option
                                            key={business.id}
                                            value={business.id}
                                        >
                                            {business.name}
                                        </option>
                                    ))}
                                </select>

                                <button disabled={!businesses.length}>
                                    Create Assistant
                                </button>
                            </form>
                        </div>
                    </section>

                    {/* ASSISTANT LIST */}

                    <section className="panel assistant-list">
                        <h3>Your AI Assistants</h3>

                        {chatbots.length === 0 ? (
                            <p>No assistants created yet.</p>
                        ) : (
                            chatbots.map(bot => (
                                <div
                                    className="assistant-item"
                                    key={bot.id}
                                >
                                    <div>
                                        <h4>{bot.name}</h4>
                                        <p>Assistant ID: {bot.id}</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedChatbot(bot);
                                            setTimeout(
                                                () => scrollToSection("assistants"),
                                                100
                                            );
                                        }}
                                    >
                                        Preview Assistant
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => openEditChatbot(bot)}
                                    >
                                        Edit Assistant
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => openKnowledgeBase(bot)}
                                    >
                                        Manage Knowledge
                                    </button>

                                    <label className="upload-button">
                                        Upload PDFs

                                        <input
                                            type="file"
                                            accept=".pdf,application/pdf"
                                            multiple
                                            hidden
                                            disabled={uploading}
                                            onChange={e => uploadPDF(e, bot.id)}
                                        />
                                    </label>

                                    <ChatbotShare
                                        chatbotId={bot.id}
                                        onSaved={handleAppearanceSaved}
                                    />
                                </div>
                            ))
                        )}
                    </section>
                </div>

                {/* KNOWLEDGE BASE */}

                <section
                    id="knowledge"
                    className="panel knowledge-panel dashboard-section"
                >
                    {knowledgeChatbot ? (
                        <>
                            <div className="knowledge-heading">
                                <div>
                                    <p className="eyebrow">
                                        KNOWLEDGE MANAGEMENT
                                    </p>

                                    <h3>{knowledgeChatbot.name}</h3>

                                    <p>
                                        Manage the PDF documents used by this assistant.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setKnowledgeChatbot(null)}
                                >
                                    Close
                                </button>
                            </div>

                            <label className="upload-button knowledge-upload">
                                {uploading
                                    ? "Uploading..."
                                    : "＋ Upload PDF Documents"}

                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    multiple
                                    hidden
                                    disabled={uploading}
                                    onChange={e =>
                                        uploadPDF(e, knowledgeChatbot.id)
                                    }
                                />
                            </label>

                            <p className="knowledge-hint">
                                You can select multiple PDF files. Each file must be
                                smaller than 10 MB.
                            </p>

                            <div className="document-list">
                                <h4>
                                    Uploaded Documents ({documents.length})
                                </h4>

                                {loadingDocuments ? (
                                    <p>Loading documents...</p>
                                ) : documents.length === 0 ? (
                                    <p>
                                        No documents uploaded yet. Add PDFs to train
                                        your assistant with business information.
                                    </p>
                                ) : (
                                    documents.map(document => (
                                        <div
                                            className="document-item"
                                            key={document.id}
                                        >
                                            <div className="document-info">
                                                <span className="document-icon">
                                                    PDF
                                                </span>

                                                <div>
                                                    <h4>{document.filename}</h4>

                                                    <p>
                                                        {document.status} ·
                                                        {" "}
                                                        {document.total_chunks}
                                                        {" "}
                                                        knowledge sections
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="delete-document"
                                                onClick={() => deletePDF(document.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div>
                            <p className="eyebrow">KNOWLEDGE MANAGEMENT</p>
                            <h3>Knowledge Base</h3>

                            <p>
                                Select an AI assistant to manage its PDF documents
                                and business knowledge.
                            </p>

                            {chatbots.length === 0 ? (
                                <p>
                                    Create your first AI assistant to get started.
                                </p>
                            ) : (
                                <div className="document-list">
                                    {chatbots.map(bot => (
                                        <div
                                            className="document-item"
                                            key={bot.id}
                                        >
                                            <div className="document-info">
                                                <span className="document-icon">
                                                    AI
                                                </span>

                                                <div>
                                                    <h4>{bot.name}</h4>
                                                    <p>Assistant ID: {bot.id}</p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="upload-button"
                                                onClick={() => openKnowledgeBase(bot)}
                                            >
                                                Manage Documents
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* LEADS */}

                <section
                    id="leads"
                    className="dashboard-section"
                >
                    <LeadManagement />
                </section>

                {/* PRICING PLANS */}

                <section
                    id="pricing"
                    className="dashboard-section"
                >
                    <PricingPlans />
                </section>

                {/* CHATBOT EDITING */}

                {editingChatbot && (
                    <section className="panel chatbot-edit-panel">
                        <h3>Customise Your Assistant</h3>

                        <p>
                            Personalise how your chatbot interacts with customers.
                        </p>

                        <form onSubmit={updateChatbot}>
                            <label>Assistant Name</label>

                            <input
                                value={editBotName}
                                onChange={e => setEditBotName(e.target.value)}
                                placeholder="Assistant name"
                                required
                            />

                            <label>Welcome Message</label>

                            <textarea
                                value={editWelcomeMessage}
                                onChange={e => setEditWelcomeMessage(e.target.value)}
                                placeholder="Welcome your customers..."
                                required
                            />

                            <label>Description</label>

                            <textarea
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                placeholder="Describe what this assistant helps customers with..."
                            />

                            <label className="active-toggle">
                                <input
                                    type="checkbox"
                                    checked={editActive}
                                    onChange={e => setEditActive(e.target.checked)}
                                />
                                Assistant is active
                            </label>

                            <div className="edit-actions">
                                <button type="submit">
                                    Save Changes
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setEditingChatbot(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {/* CHATBOT PREVIEW */}

                {selectedChatbot && (
                    <section className="panel">
                        <h3>Preview Your AI Assistant</h3>

                        <ChatWidget
                            chatbotId={selectedChatbot.id}
                            chatbotName={selectedChatbot.name}
                            welcomeMessage={selectedChatbot.welcome_message}
                            themeColor={
                                selectedChatbot.theme_color || "#173D32"
                            }
                        />
                    </section>
                )}

                {/* NOTIFICATIONS */}

                {message && (
                    <p className="notice">{message}</p>
                )}

            </main>
        </div>
    );
}

export default App;