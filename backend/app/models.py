from datetime import datetime
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    businesses = db.relationship(
        "Business",
        back_populates="owner",
        cascade="all, delete-orphan"
    )


class Business(db.Model):
    __tablename__ = "businesses"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    industry = db.Column(db.String(100))
    description = db.Column(db.Text)

    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    owner = db.relationship("User", back_populates="businesses")

    chatbots = db.relationship(
        "Chatbot",
        back_populates="business",
        cascade="all, delete-orphan"
    )


class Chatbot(db.Model):
    __tablename__ = "chatbots"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)

    welcome_message = db.Column(
        db.String(500),
        default="Hello! How can I help you today?"
    )

    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)

    business_id = db.Column(
        db.Integer,
        db.ForeignKey("businesses.id"),
        nullable=False
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    business = db.relationship("Business", back_populates="chatbots")

    documents = db.relationship(
        "KnowledgeDocument",
        back_populates="chatbot",
        cascade="all, delete-orphan"
    )

    conversations = db.relationship(
        "Conversation",
        back_populates="chatbot",
        cascade="all, delete-orphan"
    )


class KnowledgeDocument(db.Model):
    __tablename__ = "knowledge_documents"

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500))
    extracted_text = db.Column(db.Text)
    processing_status = db.Column(db.String(50), default="pending")

    chatbot_id = db.Column(
        db.Integer,
        db.ForeignKey("chatbots.id"),
        nullable=False
    )

    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    chatbot = db.relationship("Chatbot", back_populates="documents")

    chunks = db.relationship(
        "KnowledgeChunk",
        back_populates="document",
        cascade="all, delete-orphan"
    )


class KnowledgeChunk(db.Model):
    __tablename__ = "knowledge_chunks"

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    chunk_index = db.Column(db.Integer, nullable=False)
    embedding_json = db.Column(db.Text)

    document_id = db.Column(
        db.Integer,
        db.ForeignKey("knowledge_documents.id"),
        nullable=False
    )

    chatbot_id = db.Column(
        db.Integer,
        db.ForeignKey("chatbots.id"),
        nullable=False
    )

    document = db.relationship(
        "KnowledgeDocument",
        back_populates="chunks"
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Conversation(db.Model):
    __tablename__ = "conversations"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    visitor_name = db.Column(db.String(120))

    chatbot_id = db.Column(
        db.Integer,
        db.ForeignKey("chatbots.id"),
        nullable=False
    )

    started_at = db.Column(db.DateTime, default=datetime.utcnow)

    chatbot = db.relationship("Chatbot", back_populates="conversations")

    messages = db.relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)

    conversation_id = db.Column(
        db.Integer,
        db.ForeignKey("conversations.id"),
        nullable=False
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    conversation = db.relationship(
        "Conversation",
        back_populates="messages"
    )