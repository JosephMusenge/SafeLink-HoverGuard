from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from features import extract_features
import numpy as np

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}}) 

# Load the trained model
model = joblib.load('phishing_model.pkl')

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

if __name__ == '__main__':
    print("ML Server running on http://localhost:5001")
    app.run(port=5001, debug=True)