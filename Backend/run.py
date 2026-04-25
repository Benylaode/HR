from app import create_app, db
import os
from flask_cors import CORS

app = create_app()

CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",           # Untuk test lokal
            "https://caturcomputer.com/",       # Domain Frontend Utama
            "https://www.caturcomputer.com/"    # Domain dengan www
        ],
        "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization", "X-Title", "X-Requested-With"]
    }
})

with app.app_context():
    db.create_all()


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
