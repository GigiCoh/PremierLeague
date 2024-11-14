from flask import Flask, request, jsonify
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from flask_cors import CORS
app = Flask(__name__)
CORS(app) 


# Load your dataset (ensure it's available in the server)
df = pd.read_csv('premierLeague.csv')

@app.route('/get_teams_data', methods=['POST'])
def get_teams_data():
    data = request.get_json()
    team1 = data['team1']
    team2 = data['team2']

    #Data display in table and graph
    df_team1_s = df[df['Team'] == team1].set_index('Match_Date')[['Score']]
    df_team2_s = df[df['Team'] == team2].set_index('Match_Date')[['Score']]
    
   # Convert dataframes to dictionaries to send as JSON
    team1_data_s = df_team1_s.to_dict(orient='index')
    team2_data_s = df_team2_s.to_dict(orient='index')


    # Filter data for team1 and team2
    df_team1 = df[df['Team'] == team1][['Match_Date', 'Score']]
    df_team2 = df[df['Team'] == team2][['Match_Date', 'Score']]

  # Convert Match_Date to datetime and set as index
    df_team1['Match_Date'] = pd.to_datetime(df_team1['Match_Date'], errors='coerce')
    df_team2['Match_Date'] = pd.to_datetime(df_team2['Match_Date'], errors='coerce')

    df_team1.dropna(subset=['Match_Date'], inplace=True)
    df_team2.dropna(subset=['Match_Date'], inplace=True)

    df_team1.set_index('Match_Date', inplace=True)
    df_team2.set_index('Match_Date', inplace=True)

    # Resample and interpolate
    df_team1 = df_team1.resample('D').asfreq().interpolate(method='linear')
    df_team2 = df_team2.resample('D').asfreq().interpolate(method='linear')

    # Convert indices to strings for JSON serialization
    team1_data = df_team1.rename_axis('Match_Date').reset_index()
    team2_data = df_team2.rename_axis('Match_Date').reset_index()
    
    team1_data['Match_Date'] = team1_data['Match_Date'].dt.strftime('%Y-%m-%d')
    team2_data['Match_Date'] = team2_data['Match_Date'].dt.strftime('%Y-%m-%d')

    team1_data = team1_data.set_index('Match_Date').to_dict(orient='index')
    team2_data = team2_data.set_index('Match_Date').to_dict(orient='index')

    # Predict next scores using ARIMA
    next_score_team1 = predict_next_score(df_team1['Score'])
    next_score_team2 = predict_next_score(df_team2['Score'])
    
    return jsonify({
        'team1_data': team1_data_s,
        'team2_data': team2_data_s,
        'team1_prediction': next_score_team1,
        'team2_prediction': next_score_team2,

    })

# Function to predict the next scores using ARIMA
def predict_next_score(score_series):
    try:
        model = ARIMA(score_series, order=(2, 0, 2))
        model_fit = model.fit()
        
        # Forecast the next period (e.g., next match or day)
        forecast = model_fit.forecast(steps=1)  # Adjust steps if more predictions are needed
        forecast_results = forecast.round().astype(int).tolist()  # Convert to integer list for JSON
        
        return forecast_results
    except Exception as e:
        print(f"Error in ARIMA prediction: {e}")
        return None

if __name__ == '__main__':
    app.run(debug=True)
