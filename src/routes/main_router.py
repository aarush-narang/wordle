__name__ = 'main' # have to change the name for some reason otherwise it wont import

from flask import Blueprint, jsonify, render_template, request
import os, json, random, re
from datetime import datetime, timedelta


main_router = Blueprint(__name__, 'routes')

# Constants
SUPPORTED_MODES = [
    'english',
    'spanish',
    'foods',
]
CURDIR = os.path.dirname(os.path.abspath(__file__))
WORDSDIR = os.path.abspath('static/words')

# Functions
def getNextMidnightTimestamp():
    return (datetime.now() + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()

def getRandomWord(mode):
    with open(WORDSDIR + f'\\{mode}\\words.txt', 'r') as f: # get random word
        return random.choice(list(f)).strip()

def updateWordAndTS(word, mode, info):
    with open(CURDIR + '\\wordle.info.json', 'w') as f:
        info[f'{mode}_word'] = word
        info[f'{mode}_nextWordTS'] = getNextMidnightTimestamp()
        json.dump(info, f)

def getWordleWord(mode):
    with open(CURDIR + '\\wordle.info.json', 'r') as f:
        info:dict = json.load(f)
    
        if len(info) != len(SUPPORTED_MODES)*2 and (info.get(f'{mode}_word') == '' or not info.get(f'{mode}_word')):
            word = getRandomWord(mode)
            updateWordAndTS(word, mode, info)

            return word # pick random word because there is no word and update json file (word, ts) as well
        elif int(info[f'{mode}_nextWordTS']) < datetime.now().timestamp():
            word = getRandomWord(mode) # pick random word because the next word is due
            updateWordAndTS(word, mode, info)

            return word # pick random word because the next word is due and update next TS as well

        return info[f'{mode}_word'], info[f'{mode}_nextWordTS']

# Routing
@main_router.route('/')
def home():
    return render_template('home.html')

@main_router.route('/get_word')
def get_word():
    mode = request.args.get('mode')
    if not mode:
        return '''
        <h1>Bad Request</h1>
        <h3 style="font-weight: normal">Mode not specified</h3>
        ''', 400
    elif mode not in SUPPORTED_MODES:
        return '''
        <h1>Bad Request</h1>
        <h3 style="font-weight: normal">Mode not supported</h3>
        ''', 400 # bad request code?
    else:
        (word, nextWordTS, *args) = getWordleWord(mode)
        return jsonify({
            'word': word,
            'nextWordTS': nextWordTS
        })

@main_router.route('/validate_word')
def check_word():
    word = request.args.get('word')
    mode = request.args.get('mode')
    if not word or not mode:
        return '''
        <h1>Bad Request</h1>
        <h3 style="font-weight: normal">Word or Mode not specified</h3>
        ''', 400
    elif mode not in SUPPORTED_MODES:
        return '''
        <h1>Bad Request</h1>
        <h3 style="font-weight: normal">Mode not supported</h3>
        ''', 400
    else:
        with open(WORDSDIR + f'\\{mode}\\words.txt', 'r') as f:
            if re.search(rf'{word}\n?', f.read(), re.IGNORECASE):
                return jsonify(True)
            else:
                return jsonify(False)