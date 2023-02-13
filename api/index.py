from flask import Flask, jsonify, render_template, request, make_response
import os, json, random, re
from datetime import datetime, timedelta

# Constants
SUPPORTED_MODES = [
    'english',
    'spanish',
    'foods',
]

app = Flask(__name__)

# Functions
def getNextMidnightTimestamp():
    return (datetime.now() + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()

def getRandomWord(mode):
    with open(f'api/static/words/{mode}/words.txt', 'r') as f: # get random word
        return random.choice(list(f)).strip()

def updateWordAndTS(word, mode, info):
    with open('wordle.info.json', 'w+') as f:
        info[f'{mode}_word'] = word
        info[f'{mode}_nextWordTS'] = getNextMidnightTimestamp()
        json.dump(info, f)

def getWordleWord(mode):
    if not os.path.exists('wordle.info.json'): # if the file doesn't exist, create it
        with open('wordle.info.json', 'w+') as f:
            json.dump({}, f)

    with open('wordle.info.json', 'r') as f:
        info:dict = json.load(f)
        
        # if the word is empty or the next word timestamp is in the past, get a new word
        if (len(info) != len(SUPPORTED_MODES)*2 and (info.get(f'{mode}_word') == '' or not info.get(f'{mode}_word'))) or int(info[f'{mode}_nextWordTS']) < datetime.now().timestamp():
            word = getRandomWord(mode)
            updateWordAndTS(word, mode, info)

        return {
            'word': info[f'{mode}_word'],
            'nextWordTS': info[f'{mode}_nextWordTS']
        }

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

if __name__ == '__main__':
    app.run(debug=True)