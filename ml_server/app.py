from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from features import extract_features
import numpy as np
import os
import csv
from datetime import datetime

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}}) 

# Load the trained model
model_path = os.path.join(os.path.dirname(__file__), 'phishing_model.pkl')
model = joblib.load(model_path)

@app.route('/predict', methods=['POST'])
def predict():
    # receive the data from chrome
    data = request.json
    url = data.get('url', '')
    
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    # convert URL to numbers (using our features.py)
    features = extract_features(url)
    
    # predict using the model
    prediction_probs = model.predict_proba([features])[0] 
    
    phishing_probability = prediction_probs[1] 
    is_phishing = phishing_probability > 0.5

    # send answer back to chrome
    return jsonify({
        'url': url,
        'is_phishing': bool(is_phishing),
        'confidence_score': float(phishing_probability * 100)
    })

# New endpoint to receive user feedback
@app.route('/feedback', methods=['POST'])
def feedback():
    data = request.json
    url = data.get('url', '')
    user_feedback = data.get('feedback', '') # e.g., 'safe' or 'phishing'
    
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    # Log to a CSV file for future retraining
    feedback_file = os.path.join(os.path.dirname(__file__), 'feedback_log.csv')
    
    # Check if file exists to write header
    file_exists = os.path.isfile(feedback_file)
    
    with open(feedback_file, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        if not file_exists:
            writer.writerow(['timestamp', 'url', 'reported_as'])
        
        writer.writerow([datetime.now(), url, user_feedback])

    return jsonify({'message': 'Feedback received', 'status': 'success'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f" ML Server running on port {port}")
    app.run(host='0.0.0.0', port=port)
    # print("ML Server running on http://localhost:5001")
    # app.run(port=5001, debug=True)