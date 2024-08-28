# routes/main_routes.py

from flask import Blueprint, render_template
from nba_api.stats.static import players

main_bp = Blueprint('main', __name__)

all_players = players.get_players()
player_names = [player['full_name'] for player in all_players]

@main_bp.route('/')
def home():
    return render_template('index.html', players=player_names)

@main_bp.route('/nba')
def nba():
    return render_template('nba.html', players=player_names)
