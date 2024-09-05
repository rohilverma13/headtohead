# utils/nba_utils.py

import base64
import requests
from io import BytesIO
from nba_api.stats.static import players, teams
from nba_api.stats.endpoints import playercareerstats, playergamelog
import pandas as pd
from PIL import Image
import time

regular_season = pd.read_csv('static/data/reg_season.csv')
teams_data = pd.read_csv('static/data/teams_data.csv')

max_values = {
    'MP': 42,
    'FG': 10,
    'FGA': 20,
    'FG%': .64,
    '3P': 3,
    '3PA': 6,
    '3P%': .42,
    '2P': 10,
    '2PA': 20,
    '2P%': .70,
    'eFG%': .63,
    'FT': 6.5,
    'FTA': 10,
    'FT%': .94,
    'ORB': 5,
    'DRB': 13,
    'TRB': 13,
    'AST': 12,
    'STL': 3.5,
    'BLK': 2,
    'TOV': 3,
    'PF': 5,
    'PTS': 35
}

#Method to get list of seasons played:
def reg_seasons(player_name):
    player_data = regular_season[(regular_season['Player'] == player_name)]
    result =  player_data['SEASON'].tolist()
    return result

# Method to get averages for a player for a given season
def reg_season_averages(season, player_name):
    # Ensure player names are in lowercase for comparison
    regular_season_copy = regular_season.copy()
    regular_season_copy['Player'] =regular_season_copy['Player'].str.lower()
    player_name = player_name.lower()
    
    # Filter the DataFrame for the specified season and player
    player_data =regular_season_copy[(regular_season_copy['SEASON'] == season) & (regular_season_copy['Player'] == player_name)].copy()
    
    if player_data.empty:
        return f"No data found for {player_name} in season {season}"
    
    # List of columns to be converted to floats
    float_columns = ['MP', 'FG', 'FGA', 'FG%', '3P', '3PA', '3P%', '2P', '2PA', '2P%', 'eFG%', 'FT', 'FTA', 'FT%', 'ORB', 'DRB', 'TRB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS']
    
    # Convert specified columns to floats
    player_data[float_columns] = player_data[float_columns].astype(float)
    
    return player_data[float_columns].to_dict(orient='records')[0]

def career_averages(player_name):
    # Ensure player names are in lowercase for comparison
    data = regular_season.copy()  # Create a copy of the DataFrame to avoid modifying the original

    data['Player'] = data['Player'].str.lower()
    player_name = player_name.lower()
    
    # Filter the DataFrame for the specified player
    player_data = data.loc[data['Player'] == player_name].copy()  # Create a copy of the slice to avoid SettingWithCopyWarning
    
    if player_data.empty:
        return f"No data found for player {player_name}"
    
    # List of columns to be converted to floats
    float_columns = ['MP', 'FG', 'FGA', 'FG%', '3P', '3PA', '3P%', '2P', '2PA', '2P%', 'eFG%', 'FT', 'FTA', 'FT%', 'ORB', 'DRB', 'TRB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS']
    
    # Convert specified columns to numeric, forcing errors to NaN
    player_data[float_columns + ['G']] = player_data[float_columns + ['G']].apply(pd.to_numeric, errors='coerce')
    
    # Calculate career totals by multiplying each stat by the games played, skipping NaNs
    career_totals = {}
    for col in float_columns:
        career_totals[col] = (player_data[col] * player_data['G']).sum(skipna=True)
    
    # Calculate total games played
    total_games = player_data['G'].sum(skipna=True)
    
    # Calculate career averages
    career_averages = {col: career_totals[col] / total_games for col in float_columns}
    
    return career_averages

# Method to normalize values based on max_values
def normalize_values(data):
    if(type(data) == str):
        return
    normalized_data = {}
    for key, value in data.items():
        if key in max_values:
            normalized_data[key] = (value / max_values[key]) * 100
        else:
            normalized_data[key] = value
    
    return normalized_data



def sleep():
    time.sleep(.6)

def get_player_id(player_name):
    player_dict = players.find_players_by_full_name(player_name)
    if player_dict:
        return player_dict[0]['id']
    else:
        return None

def get_regular_season_stats(season, player_name):
    player_dict = players.find_players_by_full_name(player_name)
    if not player_dict:
        return None
    
    player_id = player_dict[0]['id']
    player_career = playercareerstats.PlayerCareerStats(player_id=player_id)
    player_career_df = player_career.get_data_frames()[0]
    season_stats_df = player_career_df[player_career_df['SEASON_ID'] == season]
    
    if season_stats_df.empty:
        return None
    
    stats_columns = ['GP', 'MIN', 'FGM', 'FGA', 'FG3M', 'FG3A', 'FTM', 'FTA', 
                     'OREB', 'DREB', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS']
    
    per_game_stats_df = season_stats_df.copy()
    for col in stats_columns:
        if col != 'GP':
            per_game_stats_df[col] = season_stats_df[col] / season_stats_df['GP']
    
    season_stats = pd.Series({
        'PTS': per_game_stats_df['PTS'].mean(),
        'AST': per_game_stats_df['AST'].mean(),
        'REB': per_game_stats_df['REB'].mean(),
        'STOCKS': (per_game_stats_df['STL'].mean() + per_game_stats_df['BLK'].mean()),
        'FT_PCT': per_game_stats_df['FT_PCT'].mean(),
        'FG3M': per_game_stats_df['FG3M'].mean()
    })
    return season_stats

def get_playoff_per_game_averages(player_name, season):
    player_info = players.find_players_by_full_name(player_name)
    if not player_info:
        return None

    player_id = player_info[0]['id']
    player_logs = playergamelog.PlayerGameLog(player_id=player_id, season=season, season_type_all_star='Playoffs')
    player_logs_df = player_logs.get_data_frames()[0]

    if player_logs_df.empty:
        return None

    per_game_averages = player_logs_df.mean(numeric_only=True)
    per_game_averages['PLAYER_ID'] = player_id
    per_game_averages['PLAYER_NAME'] = player_info[0]['full_name']

    return pd.Series({
        'PTS': per_game_averages['PTS'],
        'AST': per_game_averages['AST'],
        'REB': per_game_averages['REB'],
        'STOCKS': (per_game_averages['STL'] + per_game_averages['BLK']),
        'FT_PCT': per_game_averages['FT_PCT'],
        'FG3M': per_game_averages['FG3M']
    })

def get_player_seasons(player_name):
    player_id = get_player_id(player_name)
    player_career = playercareerstats.PlayerCareerStats(player_id=player_id)
    player_career_df = player_career.get_data_frames()[0]
    seasons = player_career_df['SEASON_ID'].unique().tolist()
    return player_id, seasons

def played_in_playoffs(player_id, season):
    game_logs = playergamelog.PlayerGameLog(player_id=player_id, season=season, season_type_all_star='Playoffs')
    game_logs_df = game_logs.get_data_frames()[0]
    return not game_logs_df.empty

def get_playoff_seasons(player_name):
    player_id, seasons = get_player_seasons(player_name)
    playoff_seasons = [season for season in seasons if played_in_playoffs(player_id, season)]
    playoff_seasons = [season + ' Playoffs' for season in playoff_seasons]
    return playoff_seasons, seasons

def fetch_career_stats(player_id):
    player_career = playercareerstats.PlayerCareerStats(player_id=player_id)
    career_df = player_career.get_data_frames()[0]
    return career_df

def calculate_career_averages(career_df):
    total_games = career_df['GP'].sum()
    career_averages = pd.Series({
        'PTS': career_df['PTS'].sum() / total_games,
        'AST': career_df['AST'].sum() / total_games,
        'REB': career_df['REB'].sum() / total_games,
        'STOCKS': (career_df['STL'].sum() + career_df['BLK'].sum()) / total_games,
        'FT_PCT': career_df['FT_PCT'].mean(),
        'FG3M': career_df['FG3M'].sum() / total_games
    })
    return career_averages

def normalize_data(averages, max_values):
    normalized_stats = pd.Series({
        'PTS': averages['PTS'] / max_values['PTS'] * 100,
        'AST': averages['AST'] / max_values['AST'] * 100,
        'REB': averages['REB'] / max_values['REB'] * 100,
        'STOCKS': averages['STOCKS'] / max_values['STOCKS'] * 100,
        'FT_PCT': averages['FT_PCT'] / max_values['FT_PCT'] * 100,
        'FG3M': averages['FG3M'] / max_values['FG3M'] * 100
    })
    return normalized_stats

# max_values = {
#     'PTS': 35,
#     'AST': 10,
#     'REB': 15,
#     'STOCKS': 4,
#     'FT_PCT': 1,
#     'FG3M': 4
# }

def fetch_player_image(player_id):
    url = f"https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/{player_id}.png"
    response = requests.get(url)
    if response.status_code == 200:
        return Image.open(BytesIO(response.content))
    else:
        return None

def process_image(image):
    output_image = image
    buffered = BytesIO()
    output_image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return img_str

def get_team(player_name, season):
    if season == 'Career':
        team = regular_season[(regular_season['Player'] == player_name)]['TEAM'].values[-1]
    else:
        team = regular_season[(regular_season['Player'] == player_name) & (regular_season['SEASON'] == season)]['TEAM'].values[0]
        
    nickname = teams_data.loc[teams_data['abbreviation'] == team, 'nickname'].values[0]
    return nickname

def get_team_name(player_id):
    # time.sleep(0.6)
    career_stats = playercareerstats.PlayerCareerStats(player_id=player_id)
    career_stats_df = career_stats.get_data_frames()[0]
    
    # Get the most recent team ID
    recent_team_id = career_stats_df.iloc[-1]['TEAM_ID']
    
    # Fetch all NBA teams
    nba_teams = teams.get_teams()
    nba_teams_df = pd.DataFrame(nba_teams)
    
    # Find the team nickname using the team ID
    team_nickname = nba_teams_df.loc[nba_teams_df['id'] == recent_team_id, 'nickname'].values[0]
    
    return team_nickname

def calculate_combined_playoff_averages(player_name):
    player_info = players.find_players_by_full_name(player_name)
    if not player_info:
        return None

    player_id = player_info[0]['id']

    pseasons = get_playoff_seasons('Lebron James')[0]

    full_playoffs = []
    for pseason in pseasons:
        season = pseason.replace(' Playoffs', '')
        full_playoffs.append(get_playoff_per_game_averages('Lebron James', season))


    df = pd.concat(full_playoffs)
    per_game_averages = df.mean(numeric_only=True)
    per_game_averages['PLAYER_ID'] = player_id
    per_game_averages['PLAYER_NAME'] = player_info[0]['full_name']

    final = pd.Series({
        'PTS': per_game_averages['PTS'],
        'AST': per_game_averages['AST'],
        'REB': per_game_averages['REB'],
        'STOCKS': (per_game_averages['STL'] + per_game_averages['BLK']),
        'FT_PCT': per_game_averages['FT_PCT'],
        'FG3M': per_game_averages['FG3M']
    })
    return final