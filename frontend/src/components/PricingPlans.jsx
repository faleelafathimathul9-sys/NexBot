import React from "react";

const plans = [
    {
        name: "Free",
        price: "₹0",
        period: "Forever",
        description: "For individuals and small businesses getting started.",
        features: [
            "1 AI assistant",
            "2 PDF knowledge documents",
            "English and Kannada support",
            "Basic lead generation",
            "Basic analytics",
            "Website chatbot integration",
            "NexBot branding"
        ],
        button: "Current Starter Plan",
        featured: false
    },
    {
        name: "Pro",
        price: "₹499",
        period: "per month (proposed)",
        description: "For growing businesses that need more flexibility.",
        features: [
            "Up to 5 AI assistants",
            "Up to 20 PDF documents",
            "English and Kannada support",
            "Advanced lead management",
            "Detailed analytics",
            "Custom chatbot branding",
            "Website integration"
        ],
        button: "Coming Soon",
        featured: true
    },
    {
        name: "Business",
        price: "Custom",
        period: "Contact for pricing",
        description: "For larger businesses with advanced requirements.",
        features: [
            "Multiple AI assistants",
            "Higher document limits",
            "English and Kannada support",
            "Advanced lead management",
            "Business analytics",
            "Custom branding",
            "Priority support"
        ],
        button: "Coming Soon",
        featured: false
    }
];

function PricingPlans() {
    return (
        <section style={styles.container}>
            <div style={styles.heading}>
                <p style={styles.eyebrow}>SIMPLE AND FLEXIBLE</p>
                <h2>Plans for every business</h2>
                <p>
                    Start free and choose a plan as your business grows.
                </p>
            </div>

            <div style={styles.grid}>
                {plans.map(plan => (
                    <div
                        key={plan.name}
                        style={{
                            ...styles.card,
                            border: plan.featured
                                ? "2px solid #173D32"
                                : "1px solid #E5E7EB"
                        }}
                    >
                        {plan.featured && (
                            <span style={styles.badge}>
                                MOST POPULAR
                            </span>
                        )}

                        <h3>{plan.name}</h3>

                        <h2 style={styles.price}>
                            {plan.price}
                        </h2>

                        <p style={styles.period}>
                            {plan.period}
                        </p>

                        <p style={styles.description}>
                            {plan.description}
                        </p>

                        <div style={styles.divider} />

                        <p style={styles.featureTitle}>
                            What's included
                        </p>

                        <ul style={styles.features}>
                            {plan.features.map(feature => (
                                <li key={feature}>✓ {feature}</li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            disabled
                            style={{
                                ...styles.button,
                                background: plan.featured
                                    ? "#173D32"
                                    : "#F3F4F6",
                                color: plan.featured
                                    ? "white"
                                    : "#374151"
                            }}
                        >
                            {plan.button}
                        </button>
                    </div>
                ))}
            </div>

            <p style={styles.note}>
                Pricing and plan limits are proposed for demonstration.
                Subscription and payment features are not activated yet.
            </p>
        </section>
    );
}

const styles = {
    container: {
        padding: "28px 0",
        width: "100%"
    },
    heading: {
        marginBottom: "28px"
    },
    eyebrow: {
        color: "#173D32",
        fontSize: "12px",
        fontWeight: "700",
        letterSpacing: "1.5px"
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "20px",
        alignItems: "stretch"
    },
    card: {
        background: "white",
        borderRadius: "14px",
        padding: "24px",
        position: "relative",
        boxShadow: "0 4px 18px rgba(0,0,0,0.04)"
    },
    badge: {
        display: "inline-block",
        background: "#E7F1EC",
        color: "#173D32",
        padding: "6px 10px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: "700",
        marginBottom: "12px"
    },
    price: {
        fontSize: "30px",
        margin: "16px 0 4px",
        color: "#173D32"
    },
    period: {
        fontSize: "12px",
        color: "#6B7280"
    },
    description: {
        fontSize: "13px",
        color: "#6B7280",
        lineHeight: 1.6,
        minHeight: "60px"
    },
    divider: {
        borderTop: "1px solid #E5E7EB",
        margin: "20px 0"
    },
    featureTitle: {
        fontWeight: "700",
        fontSize: "13px"
    },
    features: {
        paddingLeft: "0",
        listStyle: "none",
        lineHeight: "2.3",
        fontSize: "13px",
        color: "#374151"
    },
    button: {
        width: "100%",
        border: "none",
        borderRadius: "8px",
        padding: "12px",
        fontWeight: "600",
        marginTop: "16px",
        cursor: "not-allowed"
    },
    note: {
        fontSize: "12px",
        color: "#6B7280",
        marginTop: "20px",
        textAlign: "center"
    }
};

export default PricingPlans;