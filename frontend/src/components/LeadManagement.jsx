import { useEffect, useState } from "react";
import { API } from "../api";
import "./LeadManagement.css";

function LeadManagement() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    async function loadLeads() {
        setLoading(true);
        setError("");

        try {
            const result = await API.getLeads();
            setLeads(result.leads || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadLeads();
    }, []);

    async function changeStatus(leadId, status) {
        setUpdatingId(leadId);
        setError("");

        try {
            await API.updateLeadStatus(leadId, status);

            setLeads(current =>
                current.map(lead =>
                    lead.id === leadId
                        ? { ...lead, status }
                        : lead
                )
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingId(null);
        }
    }

    const newLeads = leads.filter(lead => lead.status === "New").length;
    const contactedLeads = leads.filter(
        lead => lead.status === "Contacted"
    ).length;
    const convertedLeads = leads.filter(
        lead => lead.status === "Converted"
    ).length;

    return (
        <div className="lead-management">

            <div className="lead-heading">
                <div>
                    <p className="eyebrow">CUSTOMER RELATIONSHIPS</p>
                    <h2>Smart Lead Generation</h2>
                    <p>
                        Manage customer enquiries and follow up with
                        potential customers.
                    </p>
                </div>

                <button
                    type="button"
                    className="lead-refresh-button"
                    onClick={loadLeads}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Refresh Leads"}
                </button>
            </div>

            <div className="lead-stats">

                <div className="lead-stat-card">
                    <span>Total Leads</span>
                    <strong>{leads.length}</strong>
                </div>

                <div className="lead-stat-card">
                    <span>New</span>
                    <strong>{newLeads}</strong>
                </div>

                <div className="lead-stat-card">
                    <span>Contacted</span>
                    <strong>{contactedLeads}</strong>
                </div>

                <div className="lead-stat-card">
                    <span>Converted</span>
                    <strong>{convertedLeads}</strong>
                </div>

            </div>

            {error && (
                <div className="lead-error">
                    {error}
                </div>
            )}

            <div className="lead-table-container">

                <div className="lead-table-heading">
                    <div>
                        <h3>Customer Enquiries</h3>
                        <p>View and manage your potential customers.</p>
                    </div>

                    <span>{leads.length} leads</span>
                </div>

                {loading ? (

                    <div className="lead-empty">
                        Loading customer enquiries...
                    </div>

                ) : leads.length === 0 ? (

                    <div className="lead-empty">
                        <div className="lead-empty-icon">↗</div>
                        <h3>No leads yet</h3>
                        <p>
                            Customer enquiries submitted through your
                            AI assistants will appear here.
                        </p>
                    </div>

                ) : (

                    <div className="lead-list">

                        {leads.map(lead => (

                            <article className="lead-card" key={lead.id}>

                                <div className="lead-card-top">

                                    <div className="lead-customer">
                                        <div className="lead-avatar">
                                            {lead.customer_name
                                                ?.charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div>
                                            <h4>{lead.customer_name}</h4>
                                            <span>
                                                {lead.business_name}
                                            </span>
                                        </div>
                                    </div>

                                    <span
                                        className={`lead-status ${lead.status.toLowerCase()}`}
                                    >
                                        {lead.status}
                                    </span>

                                </div>

                                <div className="lead-details">

                                    <p>
                                        <strong>Phone:</strong>{" "}
                                        {lead.phone}
                                    </p>

                                    {lead.email && (
                                        <p>
                                            <strong>Email:</strong>{" "}
                                            {lead.email}
                                        </p>
                                    )}

                                    <p>
                                        <strong>Assistant:</strong>{" "}
                                        {lead.chatbot_name}
                                    </p>

                                    <p>
                                        <strong>Enquiry:</strong>{" "}
                                        {lead.enquiry}
                                    </p>

                                    <p>
                                        <strong>Received:</strong>{" "}
                                        {new Date(
                                            lead.created_at
                                        ).toLocaleString()}
                                    </p>

                                </div>

                                <div className="lead-card-footer">

                                    <label>
                                        Follow-up status

                                        <select
                                            value={lead.status}
                                            disabled={updatingId === lead.id}
                                            onChange={e =>
                                                changeStatus(
                                                    lead.id,
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="New">New</option>
                                            <option value="Contacted">
                                                Contacted
                                            </option>
                                            <option value="Converted">
                                                Converted
                                            </option>
                                        </select>
                                    </label>

                                    {updatingId === lead.id && (
                                        <span>Saving...</span>
                                    )}

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}

export default LeadManagement;