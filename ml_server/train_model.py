import joblib
import pandas as pd
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from features import extract_features

print("Loading data...")
script_directory = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_directory, 'dataset_phishing.csv')
# Load dataset
try:
    df = pd.read_csv(csv_path)
    print(f"   Loaded {len(df)} rows.")
except FileNotFoundError:
    print("Error: CSV file not found.")
    exit()

# filter out bad rows
df = df.dropna()

# Extract features and labels
print("Extracting features...")
X = []
Y = []

# loop through every row in the dataset
for index, row in df.iterrows():
    url = row['url']
    status = row['status'] 

    # extract features from url using features.py
    features = extract_features(url)
    X.append(features)

    # convert text labels to numbers
    if status == 'phishing':
        Y.append(1)
    else:
        Y.append(0)

# split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2, random_state=42)
# train model
print("Training the model...")
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# check accuracy
predictions = clf.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

joblib.dump(clf, 'phishing_model.pkl')
print("Model saved to 'phishing_model.pkl'")