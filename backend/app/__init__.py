import os
from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import db


def create_app():

    app = Flask(__name__)

    app.config.from_object(Config)

    allowed_origins = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [origin.strip() for origin in allowed_origins]
            }
        }
    )

    db.init_app(app)

    from app import models

    from app.routes.auth import auth_bp
    from app.routes.business import business_bp
    from app.routes.chatbots import chatbot_bp
    from app.routes.documents import documents_bp
    from app.routes.chat import chat_bp
    from app.routes.analytics import analytics_bp
    from app.routes.conversations import conversations_bp
    from app.routes.leads import leads_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(business_bp)
    app.register_blueprint(chatbot_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(conversations_bp)
    app.register_blueprint(leads_bp)

    with app.app_context():
        db.create_all()

    return app