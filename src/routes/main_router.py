__name__ = 'main' # have to change the name for some reason otherwise it wont import

from flask import Blueprint, jsonify, render_template, request
import os, json, random
from datetime import datetime, timedelta


main_router = Blueprint(__name__, 'routes')

# Constants
SUPPORTED_LANGUAGES = [
    'en',
    'es',
]
CURDIR = os.path.dirname(os.path.abspath(__file__))
WORDSDIR = os.path.abspath('static/words')

# Functions
def getNextMidnightTimestamp():
    return (datetime.now() + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()

def getRandomWord(lang):
    with open(WORDSDIR + f'\\{lang}\\words_{lang}.txt', 'r') as f: # get random word
        return random.choice(list(f)).strip()

def updateWordAndTS(word, lang, info):
    with open(CURDIR + '\\wordle.info.json', 'w') as f:
        info[f'{lang}_word'] = word
        info[f'{lang}_nextWordTS'] = getNextMidnightTimestamp()
        json.dump(info, f)

def getWordleWord(lang):
    with open(CURDIR + '\\wordle.info.json', 'r') as f:
        info:dict = json.load(f)
    
        if len(info) != len(SUPPORTED_LANGUAGES)*2 and (info.get(f'{lang}_word') == '' or not info.get(f'{lang}_word')):
            word = getRandomWord(lang)
            updateWordAndTS(word, lang, info)

            return word # pick random word because there is no word and update json file (word, ts) as well
        elif int(info[f'{lang}_nextWordTS']) < datetime.now().timestamp():
            word = getRandomWord(lang) # pick random word because the next word is due
            updateWordAndTS(word, lang, info)

            return word # pick random word because the next word is due and update next TS as well

        return info[f'{lang}_word'], info[f'{lang}_nextWordTS']

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
        <h3 style="font-weight: normal">Language not specified</h3>
        ''', 400
    elif mode not in SUPPORTED_LANGUAGES:
        return '''
        <h1>Bad Request</h1>
        <h3 style="font-weight: normal">Language not supported</h3>
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
    mode = request.args.get('lang')
    if not word or not mode:
        return '''
        <h1>Bad Request</h1>
        <h3 style="font-weight: normal">Word or Language not specified</h3>
        ''', 400
    elif mode not in SUPPORTED_LANGUAGES:
        return '''
        <h1>Bad Request</h1>
        <h3 style="font-weight: normal">Language not supported</h3>
        ''', 400
    else:
        with open(WORDSDIR + f'\\{mode}\\words_{mode}.txt', 'r') as f:
            if word.strip().upper() + '\n' in f:
                return jsonify(True)
            else:
                return jsonify(False)