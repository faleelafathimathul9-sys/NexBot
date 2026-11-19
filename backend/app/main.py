from app import create_app

app = create_app()


@app.route("/")
def home():
    return {
        "message": "Welcome to NexBot!",
        "status": "Backend is running successfully",
        "version": "1.0.0"
    }


@app.route("/health")
def health_check():
    return {
        "status": "healthy",
        "project": "NexBot"
    }