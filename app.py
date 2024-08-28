# app.py

from flask import Flask
from routes.main_routes import main_bp
from routes.player_routes import player_bp

app = Flask(__name__)

app.register_blueprint(main_bp)
app.register_blueprint(player_bp)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=4444, debug=True)
