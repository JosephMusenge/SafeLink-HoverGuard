import math
import re
from urllib.parse import urlparse

# helper func to calculate the shanon entropy of a string
def calculate_entropy(text):
    if not text:
        return 0
    entropy = 0
    for x in range(256):
        # Calculate the frequency of each character in the string
        p_x = float(text.count(chr(x))) / len(text)
        if p_x > 0:
            entropy += - p_x * math.log2(p_x)
    return entropy

# main func to turn url into numbers
def extract_features(url):
    features = []

    # break url into parts
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname if parsed.hostname else ""
    except:
        hostname = ""

    # feature 1: length of the url
    features.append(len(url))
    # feature 2: length of the hostname
    features.append(len(hostname))
    # feature 3: number of dots
    features.append(url.count('.'))
    # feature 4: number of hyphens
    features.append(url.count('-'))
    # feature 5: number of @ symbols
    features.append(url.count('@'))
    # feature 6: number of digits
    features.append(sum(c.isdigit() for c in url))
    # feature 7: hostname entropy
    features.append(calculate_entropy(hostname))
    # Feature 8: is it an IP Address? never log into a bank via an IP (http://192.168.1.5)
    is_ip = 1 if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname) else 0
    features.append(is_ip)

    return features