# routes/player_routes.py

from flask import Blueprint, request, jsonify, url_for
from utils.nba_utils import (
    get_player_id, 
    get_playoff_seasons,
    get_playoff_averages,
    playoff_career_averages,
    get_regular_season_stats, 
    fetch_career_stats, 
    calculate_career_averages, 
    normalize_data, 
    fetch_player_image, 
    process_image, 
    reg_season_averages,
    normalize_values,
    career_averages, 
    reg_seasons,
    get_team
)
import pandas as pd

player_bp = Blueprint('player', __name__)



@player_bp.route('/players')
def get_players():
    from nba_api.stats.static import players
    all_players = players.get_players()
    player_names = [player['full_name'] for player in all_players]
    return jsonify(player_names)

@player_bp.route('/playerinfo', methods=['POST'])
def player_info():
    data = request.get_json()
    player1_name = data.get('player1_name')
    player2_name = data.get('player2_name')
    season1 = data.get('season1')
    season2 = data.get('season2')

    # player1_id = get_player_id(player1_name)
    # player2_id = get_player_id(player2_name)

    # if not player1_id or not player2_id:
    #     return jsonify({"error": "One or both players not found"}), 404

    if season1 == 'Career':
        #averages1 = calculate_career_averages(fetch_career_stats(player1_id))
        averages1 = career_averages(player1_name)
    elif season1 == 'Playoff Career':
        averages1 = playoff_career_averages(player1_name)
    elif 'Playoffs' in season1:
        averages1 = get_playoff_averages(player1_name, season1.replace(' Playoffs', ''))
    else:
        # averages1 = get_regular_season_stats(season1, player1_name)
        averages1 = reg_season_averages(season1, player1_name)

    if season2 == 'Career':
        #averages2 = calculate_career_averages(fetch_career_stats(player2_id))
        averages2 = career_averages(player2_name)
    elif season2 == 'Playoff Career':
        averages2 = playoff_career_averages(player2_name)
    elif 'Playoffs' in season2:
        averages2 = get_playoff_averages(player2_name, season2.replace(' Playoffs', ''))
    else:
        # averages2 = get_regular_season_stats(season2, player2_name)
        averages2 = reg_season_averages(season2, player2_name)

    if averages1 is None or averages2 is None:
        return jsonify({"error": "No statistics found for one or both players in the specified seasons."}), 404

    # normalized_stats1 = normalize_data(averages1, max_values)
    # normalized_stats2 = normalize_data(averages2, max_values)



    normalized_stats1 = normalize_values(averages1)
    normalized_stats2 = normalize_values(averages2)
    


    def addPercent(data):
        if(type(data) == str):
            return
        for key, value in data.items():
            if "%" in key:
                newVal = '{:.2f}'.format(round(data[key], 3) * 100) + '%'
                data[key] = newVal
            else:
                data[key] = round(data[key], 1)
        
        
        # data['eFG%'] = str((data['eFG%'] * 100)) + "%"
        # data['FG%'] = str((data['FG%'] * 100)) + "%"
        # data['3P%'] = str((data['3P%'] * 100)) + "%"
        # data['2P%'] = str((data['2P%'] * 100)) + "%"
        # data['FT%'] = str((data['FT%'] * 100)) + "%"
        return data
    
    averages1 = addPercent(averages1)
    averages2 = addPercent(averages2)
    

    

    # def convert_to_serializable(obj):
    #     if isinstance(obj, pd.Series):
    #         return obj.to_dict()
    #     elif isinstance(obj, dict):
    #         return {k: convert_to_serializable(v) for k, v in obj.items()}
    #     elif isinstance(obj, list):
    #         return [convert_to_serializable(i) for i in obj]
    #     else:
    #         return obj

    # Convert averages and normalized stats to serializable format
    # averages1 = convert_to_serializable(averages1)
    # averages2 = convert_to_serializable(averages2)
    # normalized_stats1 = convert_to_serializable(normalized_stats1)
    # normalized_stats2 = convert_to_serializable(normalized_stats2)

    response = {
        "player1": {
            "name": player1_name + "1",
            "averages": averages1,
            "normalized": normalized_stats1
        },
        "player2": {
            "name": player2_name + "2",
            "averages": averages2,
            "normalized": normalized_stats2
        }
    }

    return jsonify(response)

@player_bp.route('/playerimage', methods=['POST'])
def player_image():
    data = request.get_json()
    player_name = data.get('player_name')

    player_id = get_player_id(player_name)
    if not player_id:
        return jsonify({"error": "Player not found"}), 404

    image = fetch_player_image(player_id)
    if not image:
        return jsonify({"error": "Image not found"}), 404

    processed_image = process_image(image)
    return jsonify({"image": processed_image})

@player_bp.route('/playerseasons', methods=['POST'])
def player_seasons():
    data = request.get_json()
    player_name = data.get('player_name')
    
    # playoff_seasons, all_seasons = get_playoff_seasons(player_name)
    all_seasons = reg_seasons(player_name=player_name)

    playoff_seasons = get_playoff_seasons(player_name=player_name)
    response = {
        "playoff_seasons": playoff_seasons,
        "regular_seasons": all_seasons
    }

    
    
    return jsonify(response)

@player_bp.route('/teaminfo', methods=['POST'])
def team_info():
    data = request.get_json()
    player_name = data.get('player_name')
    season = data.get('season')
    player_id = get_player_id(player_name)
    if not player_id:
        return jsonify({"error": "Player not found"}), 404

    #team_name = get_team_name(player_id).lower()
    team_name = get_team(player_name, season)
    gradient_url = url_for('static', filename=f'img/gradients/gradient_{team_name.lower()}.png')
    logo_url = url_for('static', filename=f'img/logos/{team_name.lower()}.png')

    response = {
        "team_name": team_name,
        "gradient_url": gradient_url,
        "logo_url": logo_url
    }

    return jsonify(response)
