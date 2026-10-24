
from flask import Flask, jsonify, request, send_from_directory
import os
import re

# Create Flask application
app = Flask(__name__)

# Get the project folder path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# Open the website
@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


# Load CSS files
@app.route("/css/<path:filename>")
def load_css(filename):
    return send_from_directory(
        os.path.join(BASE_DIR, "css"), filename
    )


# Load JavaScript files
@app.route("/js/<path:filename>")
def load_js(filename):
    return send_from_directory(
        os.path.join(BASE_DIR, "js"), filename
    )


# Check whether the input is an 8-bit binary word
def valid_word(word):
    return (
        isinstance(word, str)
        and re.fullmatch(r"[01]{8}", word) is not None
    )


# Calculate checksum
def calculate_checksum(words):
    total = 0

    for word in words:
        total += int(word, 2)

    # Add end-around carry
    while total > 255:
        total = (total & 255) + (total >> 8)

    # Invert all 8 bits
    checksum = (~total) & 255

    return format(checksum, "08b")


# Calculate checksum API
@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request data."}), 400

    words = data.get("words")

    if (
        not isinstance(words, list)
        or len(words) == 0
        or not all(valid_word(word) for word in words)
    ):
        return jsonify({
            "error": "Enter valid 8-bit binary words."
        }), 400

    checksum = calculate_checksum(words)

    return jsonify({"checksum": checksum})


# Verify received data API
@app.route("/api/verify", methods=["POST"])
def verify():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request data."}), 400

    words = data.get("words")
    checksum = data.get("checksum")

    if (
        not isinstance(words, list)
        or len(words) == 0
        or not all(valid_word(word) for word in words)
        or not valid_word(checksum)
    ):
        return jsonify({
            "error": "Invalid binary data or checksum."
        }), 400

    total = sum(int(word, 2) for word in words)
    total += int(checksum, 2)

    # Add end-around carry
    while total > 255:
        total = (total & 255) + (total >> 8)

    if total == 255:
        return jsonify({
            "valid": True,
            "message": "No error detected."
        })

    return jsonify({
        "valid": False,
        "message": "Error detected in received data."
    })


# Run the application
if __name__ == "__main__":
    app.run(debug=True)
