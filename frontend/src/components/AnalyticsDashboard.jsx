import { useEffect, useState } from "react";
import { API } from "../api";
import "./AnalyticsDashboard.css";

function AnalyticsDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        API.getAnalytics()
            .then(data => setAnalytics(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="analytics-loading">Loading analytics...</div>;
    }

    if (error) {
        return <div className="analytics-error">{error}</div>;
    }

    if (!analytics) return null;

    const stats = [
        {
            title: "Total Assistants",
            value: analytics.total_chatbots,
            icon: "🤖"
        },
        {
            title: "Active Assistants",
            value: analytics.active_chatbots,
            icon: "🟢"
        },
        {
            title: "Total Conversations",
            value: analytics.total_conversations,
            icon: "💬"
        },
        {
            title: "Customer Messages",
            value: analytics.total_messages,
            icon: "📩"
        }
    ];

    return (
        <section className="analytics-section">

            <div className="analytics-heading">
                <div>
                    <h2>Analytics Overview</h2>
                    <p>Understand how customers interact with your assistants.</p>
                </div>
            </div>

            <div className="analytics-stats-grid">
                {stats.map((stat, index) => (
                    <div className="analytics-card" key={index}>
                        <div className="analytics-card-top">
                            <span>{stat.title}</span>
                            <span className="analytics-icon">{stat.icon}</span>
                        </div>

                        <h3>{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="analytics-bottom-grid">

                <div className="analytics-panel">
                    <h3>Assistant Performance</h3>

                    {analytics.chatbot_usage.length === 0 ? (
                        <p>No assistants created yet.</p>
                    ) : (
                        <div className="analytics-table-wrapper">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Assistant</th>
                                        <th>Status</th>
                                        <th>Conversations</th>
                                        <th>Messages</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {analytics.chatbot_usage.map(bot => (
                                        <tr key={bot.chatbot_id}>
                                            <td>{bot.chatbot_name}</td>
                                            <td>
                                                <span className={
                                                    bot.status === "Active"
                                                        ? "status-active"
                                                        : "status-inactive"
                                                }>
                                                    {bot.status}
                                                </span>
                                            </td>
                                            <td>{bot.conversations}</td>
                                            <td>{bot.messages}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="analytics-panel">
                    <h3>Popular Customer Questions</h3>

                    {analytics.top_questions.length === 0 ? (
                        <p>No customer questions yet.</p>
                    ) : (
                        <div className="popular-questions">
                            {analytics.top_questions.map((item, index) => (
                                <div className="question-item" key={index}>
                                    <div>
                                        <span className="question-number">
                                            {index + 1}
                                        </span>
                                        <span>{item.question}</span>
                                    </div>

                                    <strong>{item.count}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

        </section>
    );
}

export default AnalyticsDashboard;