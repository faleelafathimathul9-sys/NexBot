from sqlalchemy import inspect, text
from app import create_app
from app.extensions import db

app = create_app()

with app.app_context():
    inspector = inspect(db.engine)

    columns = [
        column["name"]
        for column in inspector.get_columns("chatbots")
    ]

    if "theme_color" not in columns:
        db.session.execute(
            text(
                "ALTER TABLE chatbots "
                "ADD COLUMN theme_color VARCHAR(20) "
                "NOT NULL DEFAULT '#173D32'"
            )
        )

        db.session.commit()

        print("Theme colour column added successfully!")

    else:
        print("Theme colour column already exists.")