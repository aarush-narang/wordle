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
        info = json.load(f)
    
        if info[f'{lang}_word'] == '':
            word = getRandomWord(lang)
            updateWordAndTS(word, lang, info)
            
            return word # pick random word because there is no word and update json file (word, ts) as well
        elif int(info[f'{lang}_nextWordTS']) < datetime.now().timestamp():
            word = getRandomWord(lang) # pick random word because the next word is due
            updateWordAndTS(word, lang, info)

            return word # pick random word because the next word is due and update for next TS as well

        return info[f'{lang}_word']

# Routing
@main_router.route('/')
def home():
    return render_template('home.html')

@main_router.route('/get_word')
def get_word():
    lang = request.args.get('lang')
    if not lang:
        return '''
        <h1>Bad Request</h1>
        <h3 style="font-weight: normal">Language not specified</h3>
        ''', 400
    elif lang not in SUPPORTED_LANGUAGES:
        return '''
        <h1>Bad Request</h1>
        <h3 style="font-weight: normal">Language not supported</h3>
        ''', 400 # bad request code?
    else:
        return jsonify({
            'word': getWordleWord(lang)
        })