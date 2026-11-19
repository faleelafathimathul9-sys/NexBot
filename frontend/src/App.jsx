import { useState, useEffect } from "react";
import { API } from "./api";
import ChatWidget from "./components/ChatWidget";
import "./App.css";

function App() {
    const [token, setToken] = useState(
        localStorage.getItem("nexbot_token")
    );

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

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

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

    async function loadDashboard() {
        try {
            const businessData = await API.getBusinesses();
            const botData = await API.getChatbots();

            setBusinesses(
                Array.isArray(businessData)
                    ? businessData
                    : businessData.businesses || []
            );

            setChatbots(
                Array.isArray(botData)
                    ? botData
                    : botData.chatbots || []
            );

        } catch (error) {
            setMessage(error.message);
        }
    }

    useEffect(() => {
        if (token) {
            loadDashboard();
        }
    }, [token]);

    async function createBusiness(e) {
        e.preventDefault();

        try {
            await API.createBusiness({
                name: businessName,
                industry: industry,
            });

            setBusinessName("");
            setIndustry("");
            setMessage("Business created successfully!");

            await loadDashboard();

        } catch (error) {
            setMessage(error.message);
        }
    }

    async function createChatbot(e) {
        e.preventDefault();

        try {
            await API.createChatbot({
                name: botName,
                business_id: Number(selectedBusiness),
            });

            setBotName("");
            setMessage("Chatbot created successfully!");

            await loadDashboard();

        } catch (error) {
            setMessage(error.message);
        }
    }

    async function uploadPDF(e, chatbotId) {
        const file = e.target.files[0];

        if (!file) return;

        try {
            const result = await API.uploadDocument(chatbotId, file);
            setMessage(result.message);

        } catch (error) {
            setMessage(error.message);
        }

        e.target.value = "";
    }

    function logout() {
        localStorage.removeItem("nexbot_token");

        setToken(null);
        setBusinesses([]);
        setChatbots([]);
        setSelectedChatbot(null);
        setMessage("");
    }

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

    return (
        <div className="dashboard">

            <aside className="sidebar">

                <h1>NexBot<span>.</span></h1>

                <p className="sidebar-label">WORKSPACE</p>

                <p className="sidebar-item">▦ Dashboard</p>
                <p className="sidebar-item">✧ AI Assistants</p>
                <p className="sidebar-item">▤ Knowledge Base</p>

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

                <section className="welcome-section">

                    <div>
                        <p className="eyebrow">WELCOME TO NEXBOT</p>

                        <h2>
                            Build smarter customer experiences.
                        </h2>

                        <p>
                            Create AI assistants trained on your own
                            business information.
                        </p>
                    </div>

                </section>

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
                        <p>Platform</p>
                        <h2>AI + ML</h2>
                    </div>

                </section>

                <section className="management-grid">

                    <div className="panel">

                        <h3>Create Business</h3>
                        <p>Add your business to NexBot.</p>

                        <form onSubmit={createBusiness}>

                            <input
                                placeholder="Business name"
                                value={businessName}
                                onChange={e =>
                                    setBusinessName(e.target.value)
                                }
                                required
                            />

                            <input
                                placeholder="Industry (e.g. Fashion, Healthcare)"
                                value={industry}
                                onChange={e =>
                                    setIndustry(e.target.value)
                                }
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
                                onChange={e =>
                                    setBotName(e.target.value)
                                }
                                required
                            />

                            <select
                                value={selectedBusiness}
                                onChange={e =>
                                    setSelectedBusiness(e.target.value)
                                }
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
                                    onClick={() =>
                                        setSelectedChatbot(bot)
                                    }
                                >
                                    Preview Assistant
                                </button>

                                <label className="upload-button">

                                    Upload PDF

                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        hidden
                                        onChange={e =>
                                            uploadPDF(e, bot.id)
                                        }
                                    />

                                </label>

                            </div>

                        ))

                    )}

                </section>

                {selectedChatbot && (

                    <section className="panel">

                        <h3>Preview Your AI Assistant</h3>

                        <ChatWidget
                            chatbotId={selectedChatbot.id}
                            chatbotName={selectedChatbot.name}
                            welcomeMessage={
                                selectedChatbot.welcome_message
                            }
                        />

                    </section>

                )}

                {message && (
                    <p className="notice">{message}</p>
                )}

            </main>

        </div>
    );
}

export default App;