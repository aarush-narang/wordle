from flask import Flask, jsonify, render_template, request, make_response
import re
from datetime import datetime, timedelta

# Constants
SUPPORTED_MODES = [
    'english',
    'spanish',
    'foods',
]

WORDLE_INFO = {
  "english_word": "amped",
  "english_nextWordTS": 1676309665.0,
  "spanish_word": "BORTO",
  "spanish_nextWordTS": 0.0,
  "foods_word": "gravy",
  "foods_nextWordTS": 0.0
}

# Functions
def getNextMidnightTimestamp():
    return (datetime.now() + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()

def getWord(mode):
    with open(f'api/static/words/{mode}/words.txt', 'r') as f: # get random word
        # get word based on the current day of the year, so that the word is always the same for a given day
        lines = f.read().splitlines()
        index = int(getNextMidnightTimestamp()) % len(lines)
        word = lines[index]

        print(word)

    return word

def updateWordAndTS(word, mode):
    next_word_ts = getNextMidnightTimestamp()
    WORDLE_INFO[f'{mode}_word'] = word
    WORDLE_INFO[f'{mode}_nextWordTS'] = next_word_ts

def getWordleWord(mode):
    # if the word is empty or the next word timestamp is in the past, get a new word
    if (len(WORDLE_INFO) != len(SUPPORTED_MODES)*2 and (WORDLE_INFO.get(f'{mode}_word') == '' or not WORDLE_INFO.get(f'{mode}_word'))) or int(WORDLE_INFO[f'{mode}_nextWordTS']) < datetime.now().timestamp():
        word = getWord(mode)
        updateWordAndTS(word, mode)

    return {
        'word': WORDLE_INFO[f'{mode}_word'],
        'nextWordTS': WORDLE_INFO[f'{mode}_nextWordTS']
    }

# Flask App
app = Flask(__name__)

# Routing
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/get_word')
def get_word():
    mode = request.args.get('mode')
    if not mode:
        return make_response(404)
    elif mode not in SUPPORTED_MODES:
        return make_response(404)
    else:
        word_dict = getWordleWord(mode)
        return jsonify(word_dict)

@app.route('/validate_word')
def check_word():
    word = request.args.get('word')
    mode = request.args.get('mode')

    if not word or not mode:
        return make_response(404)
    elif mode not in SUPPORTED_MODES:
        return make_response(404)
    else:
        with open(f'api/static/words/{mode}/words.txt', 'r') as f:
            if re.search(rf'{word}\n?', f.read(), re.IGNORECASE): # search for word in file
                return jsonify(True)
            else:
                return jsonify(False)
