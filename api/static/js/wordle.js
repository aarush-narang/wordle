(async () => {
    const MESSAGES = new Map().set('english', [
        ['Unbelieveable!', 'Incredible!'],
        ['Spectacular!', 'Amazing!'],
        ['Impressive!', 'Remarkable!'],
        ['Great Job!', 'Cool!'],
        ['Nice!', 'Great!'],
        ['Phew!', 'Close one!']
    ]).set('spanish', [
        ['¡Increíble!', '¡Impresionante!'],
        ['¡Espectacular', '¡Magnífico!', '¡Asombroso!'],
        ['¡Extraordinario!', '¡Impresionante!'],
        ['¡Buen trabajo!', '¡Excelente!'],
        ['¡Genial!', '¡Excelente!'],
        ['¡Uf!', '¡Cierra uno!']
    ])

    function flipTile(tile) {
        tile.setAttribute('data-animation', 'flip-in')
        setTimeout(() => {
            tile.setAttribute('data-animation', 'flip-out')
            setTimeout(() => {
                tile.setAttribute('data-animation', 'idle')
            }, 250);
        }, 250);
    }

    function popTile(tile) {
        tile.setAttribute('data-animation', 'pop')
        setTimeout(() => {
            tile.setAttribute('data-animation', 'idle')
        }, 100);
    }

    function shakeRow(gameRow) {
        gameRow.setAttribute('invalid', '')
        setTimeout(() => {
            gameRow.removeAttribute('invalid', '')
        }, 600);
    }


    const helpModal = document.getElementById('help-modal')
    const settingsModal = document.getElementById('settings-modal')
    const statsModal = document.getElementById('stats-modal')

    function openStats() {
        if (helpModal.style.display === 'flex' ||
            settingsModal.style.display === 'flex' ||
            statsModal.style.display === 'flex') return
        const statsBtn = document.getElementById('stats')
        statsBtn.dispatchEvent(new MouseEvent('click'));
    }

    function openHelp() {
        if (helpModal.style.display === 'flex' ||
            settingsModal.style.display === 'flex' ||
            statsModal.style.display === 'flex') return
        const helpBtn = document.getElementById('help')
        helpBtn.dispatchEvent(new MouseEvent('click'));
    }

    function displayMsg(message = 'Error', time = 5000, color = 'var(--full-modal-bkg-color)') {
        const msg = document.getElementById('msg')

        if (msg.style.transform === 'translateY(-100%)') {
            msg.style.transform = 'translateY(30px)'
        }
        setTimeout(() => {
            msg.style.backgroundColor = color
            msg.innerHTML = message
            msg.style.opacity = 1
            msg.style.transform = 'translateY(0)'

            setTimeout(() => {
                msg.style.opacity = 0
                msg.style.transform = 'translateY(-100%)'
                msg.innerHTML = ''
                msg.style.backgroundColor = ''
            }, time)
            setTimeout(() => {
                msg.style.transform = 'translateY(30px)'
            }, time + 15);
        }, 100);
    }

    function evaluateGuess(guess, word) {
        const arr_guess = guess.split('')
        const arr_word = word.split('')
        const eval = [null, null, null, null, null]

        arr_guess.forEach((letter, i) => {
            if (letter === arr_word[i]) { // check for exact positions
                eval[i] = 'correct'
                arr_word[i] = '_'
            }
        })

        const arr_guess_set = Array.from(new Set(arr_guess))
        arr_guess_set.forEach((letter, i) => {
            if (arr_word.includes(letter)) { // check if the letter is in the word
                while (arr_word.indexOf(letter) !== -1) { // if it is, 
                    const index = arr_guess.indexOf(letter) // find the first occurence of the letter and 
                    if (!eval[index]) {
                        eval[index] = 'present' // mark it as present.
                    }
                    arr_word[arr_word.indexOf(letter)] = '_' // then remove that occurence from the word 
                    arr_guess[arr_guess.indexOf(letter)] = '_' // and the guess
                } // and keep checking until it's gone
            } else { // if neither present nor correct
                const index = arr_guess.indexOf(letter)
                if (!eval[index]) {
                    eval[index] = 'absent' // mark as absent
                }
            }
        })

        eval.forEach((e, i) => {
            if (!e) eval[i] = 'absent'
        })

        return eval
    }

    function getMarkedLetters(boardState) {
        let correct = []
        let present = []
        let absent = []
        const board = boardState.boardState // array of strings
        const evals = boardState.evaluations // array of arrays of evaluation results
        board.forEach((word, i) => {
            const eval = evals[i]
            word.split('').forEach((letter, j) => {
                if (eval[j] === 'correct') correct.push(letter)
                if (eval[j] === 'present') present.push(letter)
                if (eval[j] === 'absent') absent.push(letter)
            })
        })
        // remove duplicates
        const correct_non_dup = Array.from(new Set(correct))
        const present_non_dup = Array.from(new Set(present))
        const absent_non_dup = Array.from(new Set(absent))

        return {
            correct: correct_non_dup,
            present: present_non_dup,
            absent: absent_non_dup,
            correct_dup: correct,
            present_dup: present,
            absent_dup: absent
        }
    }

    function updateKeyboard() {
        keys.forEach(key => {
            if (markedLetters.correct.includes(key.innerText.toLowerCase())) {
                key.setAttribute('data-state', 'correct')
            } else if (markedLetters.present.includes(key.innerText.toLowerCase())) {
                key.setAttribute('data-state', 'present')
            } else if (markedLetters.absent.includes(key.innerText.toLowerCase())) {
                key.setAttribute('data-state', 'absent')
            }
        })
    }

    const shareButton = document.getElementById('stats-share')
    const stats_other = document.getElementById('stats-other')

    function getBoardText(boardState, mode) {
        mode = mode.charAt(0).toUpperCase() + mode.slice(1)

        let text = ''
        if (boardState.state === 'LOSE') { // header
            text += `Wordle: ${mode} - X/6\n\n`
        } else {
            text += `Wordle: ${mode} - ${boardState.rowIndex}/${6}\n\n`
        }

        const evals = boardState.evaluations

        evals.forEach((rowEval) => {
            if (rowEval === null) return
            rowEval.forEach((eval) => {
                if (eval === 'correct') text += '🟩'
                else if (eval === 'present') text += '🟨'
                else if (eval === 'absent') text += '⬛'
            })
            text += '\n'
        })
        return text
    }

    function updateShareButton(boardState, mode) {
        stats_other.setAttribute('data-btn-visible', 'true')

        shareButton.addEventListener('click', event => {
            event.preventDefault()
            if (shareButton.getAttribute('data-clicked')) return // prevent spamming
            if (boardState.state === 'IN_PROGRESS') return

            if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) { // if desktop (not mobile)
                shareButton.setAttribute('data-clicked', 'true')
                shareButton.innerText = 'Copied!'
                setTimeout(() => {
                    shareButton.innerText = 'Share'
                    shareButton.removeAttribute('data-clicked')
                }, 3000);
                navigator.clipboard.writeText(getBoardText(boardState, mode)) // copy the wordle game state to clipboard
            } else {
                shareButton.setAttribute('data-clicked', 'true')
                shareButton.innerText = 'Shared!'
                setTimeout(() => {
                    shareButton.innerText = 'Share'
                    shareButton.removeAttribute('data-clicked')
                }, 3000);

                if (navigator.share) { // if mobile and share API is supported
                    navigator.share({
                            text: getBoardText(boardState, mode), // wordle game state
                        })
                        .catch(console.error);
                } else {
                    navigator.clipboard.writeText(getBoardText(boardState, mode)) // copy the wordle game state to clipboard
                }
            }
        });
    }

    // stats
    const gamesPlayed = document.getElementById('num-played')
    const winPercent = document.getElementById('win-percent')
    const winStreak = document.getElementById('win-streak')
    const maxStreak = document.getElementById('max-streak')
    const avgCorerct = document.getElementById('avg-correct')
    const avgPresent = document.getElementById('avg-present')
    const avgAbsent = document.getElementById('avg-absent')
    const totalWordsGuessed = document.getElementById('words-guessed')

    // dist
    const graphBars = document.querySelectorAll('.graph-bar')
    const graphNums = document.querySelectorAll('.num-guesses')

    function updateStats(statistics, currentRowIndex) {
        gamesPlayed.innerText = statistics.gamesPlayed
        winPercent.innerText = statistics.gamesPlayed !== 0 ? `${Math.round(statistics.gamesWon / statistics.gamesPlayed * 100)}%` : 'N/A'
        winStreak.innerText = statistics.currentStreak
        maxStreak.innerText = statistics.maxStreak
        avgCorerct.innerText = statistics.wordsGuessed !== 0 ? (statistics.totalCorrect / statistics.wordsGuessed).toPrecision(2) : 'N/A'
        avgPresent.innerText = statistics.wordsGuessed !== 0 ? (statistics.totalPresent / statistics.wordsGuessed).toPrecision(2) : 'N/A'
        avgAbsent.innerText = statistics.wordsGuessed !== 0 ? (statistics.totalAbsent / statistics.wordsGuessed).toPrecision(2) : 'N/A'
        totalWordsGuessed.innerText = statistics.wordsGuessed

        const totalGuesses = Object.values(statistics.guesses).reduce((a, b) => a + b)
        graphBars.forEach((bar, i) => {
            const width = (statistics.guesses[i + 1] / totalGuesses) * 100
            bar.style.width = `${width === 0 ? 1 : width}%`
            graphNums[i].innerText = statistics.guesses[i + 1]
        })
        if (currentRowIndex || currentRowIndex === 0) graphBars[currentRowIndex].classList.add('highlight')
    }

    function resetBoardState(w) {
        window.localStorage.setItem(mode + '_boardState', JSON.stringify({
            "boardState": ["", "", "", "", "", ""],
            "evaluations": [null, null, null, null, null, null],
            "rowIndex": 0,
            "hardMode": false,
            "nextWordTS": w.nextWordTS,
            'state': 'IN_PROGRESS'
        }))
    }

    /* Wordle Game */
    const mode = window.localStorage.getItem('mode') || 'english'
    const gameRows = document.querySelectorAll('game-row')

    let word
    try {
        word = await fetch('/get_word?mode=' + mode).then(res => res.json()); // fetch word for the specific mode
    } catch (e) {
        window.localStorage.setItem('mode', 'english') // if there's an error in fetching the word from the selected mode, set the mode to english
        return window.location.reload()
    }

    if (!window.localStorage.getItem(mode + '_boardState')) resetBoardState(word) // if there is no board state, create a new board
    let boardState = JSON.parse(window.localStorage.getItem(mode + '_boardState')) // get the board state

    // check if it is a new day using the nextWordTS in localstorage
    if (boardState.nextWordTS !== word.nextWordTS) {
        // reset board state if it is not equal to the nextWordTS that was just fetched
        resetBoardState(word)
        return window.location.reload()
    }


    /* SHARE BUTTON */
    if (boardState.state !== 'IN_PROGRESS') updateShareButton(boardState, mode)


    /* STATS */
    // if there is no stats, create a new one
    if (!window.localStorage.getItem(mode + '_stats')) {
        window.localStorage.setItem(mode + '_stats', JSON.stringify({
            "gamesPlayed": 0,
            "currentStreak": 0,
            "gamesWon": 0,
            "guesses": {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
                6: 0,
            },
            "maxStreak": 0,
            "totalCorrect": 0,
            "totalPresent": 0,
            "totalAbsent": 0,
            "wordsGuessed": 0,
        }))
    }
    let stats = JSON.parse(window.localStorage.getItem(mode + '_stats')) // get the stats

    // update the stats
    if (boardState.state === 'IN_PROGRESS' || boardState.state === 'LOSE') {
        updateStats(stats, null)
    } else if (boardState.state === 'WIN') {
        updateStats(stats, boardState.rowIndex - 1) // -1 because the rowIndex is incremented after the row is finished
    }

    if (boardState.state !== 'IN_PROGRESS') {
        setTimeout(() => {
            openStats() // open the stats
        }, 2000);
    } else if (boardState.rowIndex === 0) {
        setTimeout(() => {
            openHelp()
        }, 200);
    }


    /* KEYBOARD */
    const keyboard = document.getElementById('keyboard')
    const keys = keyboard.querySelectorAll('button')
    let markedLetters = getMarkedLetters(boardState)
    let hardModeLetters = markedLetters.correct.concat(markedLetters.present)

    updateKeyboard() // update the keyboard colors


    /* LOADING PREVIOUS STATE */
    // load the board state into the game using the words stored and the evaluations
    boardState.boardState.forEach((word, i) => {
        if (word === '') return
        gameRows[i].setAttribute('letters', word)
        gameRows[i].querySelectorAll('game-tile').forEach((tile, j) => {
            tile.setAttribute('letter', word[j])
            tile.setAttribute('evaluation', boardState.evaluations[i][j])

            const divTile = tile.querySelector('.tile')
            divTile.innerText = word[j]
            divTile.setAttribute('data-state', boardState.evaluations[i][j])
            setTimeout(() => {
                flipTile(divTile)
            }, 200 + (j * 200));

        })
    })


    /* START LISTENING TO KEYBOARD */
    document.addEventListener('keydown', async (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return
        boardState = JSON.parse(window.localStorage.getItem(mode + '_boardState')) // on every keypress, get the board state to make sure it is not stale data
        if (boardState.state === 'WIN') return displayMsg(`You Won! The word was <a href="https://www.thefreedictionary.com/${word.word}">${word.word}</a>`, 1000000, 'var(--full-modal-bkg-color)')
        else if (boardState.state === 'LOSE') return displayMsg(`You Lost :(, the word was <a href="https://www.thefreedictionary.com/${word.word}">${word.word}</a>`, 1000000, 'var(--full-modal-bkg-color)')

        if ((event.key.length > 1 || !/^([A-Z]|\á|\é|\í|\ó|\ú|\ñ)$/i.test(event.key)) && event.key !== 'Backspace' && event.key !== 'Enter') return // check if input is valid

        markedLetters = getMarkedLetters(boardState)

        const rowIndex = boardState.rowIndex // get the word row they are on
        const gameRow = gameRows[rowIndex] // and get the row element from the index
        const gameTiles = gameRow.querySelectorAll('game-tile')
        const tiles = gameRow.querySelectorAll('.tile') // get all tiles from the row

        let currentLetters = gameRow.getAttribute('letters') // the letters that are currently in the row

        if (event.key === 'Backspace') { // if backspace is pressed, remove the last letter in the last tile
            if (currentLetters.length === 0) return
            gameRow.setAttribute('letters', currentLetters.slice(0, currentLetters.length - 1))
            currentLetters = gameRow.getAttribute('letters')
            tiles[currentLetters.length].setAttribute('data-state', 'empty')
            tiles[currentLetters.length].innerText = ''

            gameTiles[currentLetters.length].setAttribute('letter', '')

            popTile(tiles[currentLetters.length])
        } else if (event.key === 'Enter') { // if submitted
            if (currentLetters.length !== 5) { // check if there are even 5 letters in the row
                displayMsg('Not enough letters', 2000, 'var(--full-modal-bkg-color)')
                return shakeRow(gameRow)
            } else if (boardState.boardState.find(w => w === currentLetters)) {
                shakeRow(gameRow)
                return displayMsg('Word already used', 2000, 'var(--full-modal-bkg-color)')
            } else {
                // hard mode checks
                if (boardState.hardMode) {
                    hardModeLetters = markedLetters.correct.concat(markedLetters.present)
                    let pass = [true, null]
                    hardModeLetters.forEach((letter, i, arr) => {
                        if (!currentLetters.split('').includes(letter)) {
                            pass = [false, arr[i]]
                        }
                    })
                    if (!pass[0]) {
                        displayMsg(`You must use <b style="margin: 0 5px">${pass[1].toUpperCase()}</b> in your guess`, 5000, 'var(--full-modal-bkg-color)')
                        return shakeRow(gameRow)
                    }
                }
                // check if the word exists
                const valid = await fetch(`/validate_word?mode=${mode}&word=${currentLetters}`).then(res => res.json());
                if (!valid) {
                    displayMsg('Invalid word', 2000, 'var(--full-modal-bkg-color)')
                    return shakeRow(gameRow)
                } else {
                    const eval = evaluateGuess(currentLetters.toLowerCase(), word.word.toLowerCase()) // evaluate the guess
                    // push eval to board state and tiles, update boardstate words, and row index
                    boardState.boardState[rowIndex] = currentLetters
                    boardState.evaluations[rowIndex] = eval
                    boardState.rowIndex = rowIndex + 1
                    window.localStorage.setItem(mode + '_boardState', JSON.stringify(boardState))

                    // update the tiles and animate them
                    eval.forEach((evaluation, i) => {
                        setTimeout(() => {
                            tiles[i].setAttribute('data-state', evaluation)
                            flipTile(tiles[i])
                        }, 100 + (i * 200));
                    })

                    // update keyboard colors
                    markedLetters = getMarkedLetters(boardState)
                    setTimeout(() => {
                        updateKeyboard()
                    }, 300 + (eval.length * 200));

                    // WIN
                    if (!eval.find(e => e === 'absent') && !eval.find(e => e === 'present')) { // there are only "correct" evaluations
                        boardState.state = 'WIN'
                        window.localStorage.setItem(mode + '_boardState', JSON.stringify(boardState))

                        // update stats
                        stats.currentStreak += 1
                        stats.gamesPlayed += 1
                        stats.gamesWon += 1
                        stats.guesses[rowIndex + 1] += 1 // no -1 here because the var has not been incremented yet, +1 because the guesses obj is 1-based
                        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak)

                        stats.totalCorrect += markedLetters.correct_dup.length - 5 // subtract to remove the last word
                        stats.totalPresent += markedLetters.present_dup.length
                        stats.totalAbsent += markedLetters.absent_dup.length
                        stats.wordsGuessed += rowIndex

                        window.localStorage.setItem(mode + '_stats', JSON.stringify(stats))

                        updateStats(stats, rowIndex)
                        updateShareButton(boardState, mode)

                        // update the tiles and animate them
                        eval.forEach((evaluation, i) => {
                            setTimeout(() => {
                                tiles[i].setAttribute('data-state', evaluation)
                                tiles[i].classList.add('win')
                            }, 1200 + (i * 200));
                        })

                        setTimeout(() => { // get random message from the map
                            const setGrp = MESSAGES.get(mode) ? MESSAGES.get(mode) : MESSAGES.get('english')
                            const randomMsg = setGrp[rowIndex][(Math.round(Math.random() * (MESSAGES.get('english')[rowIndex].length - 1)))]
                            displayMsg(randomMsg, 10000, 'var(--full-modal-bkg-color)')
                            setTimeout(() => {
                                openStats()
                            }, 2000);
                        }, 500 + (eval.length * 200))
                        return
                    }
                    // LOSE
                    if (boardState.rowIndex === 6) {
                        boardState.state = 'LOSE'
                        window.localStorage.setItem(mode + '_boardState', JSON.stringify(boardState))

                        // update stats
                        stats.currentStreak = 0
                        stats.gamesPlayed += 1

                        stats.totalCorrect += markedLetters.correct_dup.length // subtract to remove the last word
                        stats.totalPresent += markedLetters.present_dup.length
                        stats.totalAbsent += markedLetters.absent_dup.length
                        stats.wordsGuessed += rowIndex

                        window.localStorage.setItem(mode + '_stats', JSON.stringify(stats))

                        updateStats(stats, null)
                        updateShareButton(boardState, mode)

                        setTimeout(() => {
                            displayMsg(`You Lost :(, the word was <a href="https://www.thefreedictionary.com/${word.word}">${word.word}</a>`, 1000000, 'var(--full-modal-bkg-color)')
                            setTimeout(() => {
                                openStats()
                            }, 2000);
                        }, 200 + (eval.length * 200));
                        return
                    }
                }
            }
        } else {
            if (currentLetters.length === 5) return
            gameRow.setAttribute('letters', currentLetters + event.key)
            tiles[currentLetters.length].setAttribute('data-state', 'tbd')
            tiles[currentLetters.length].setAttribute('data-animation', 'pop')
            setTimeout(() => {
                tiles[currentLetters.length].setAttribute('data-animation', 'idle')
            }, 100);
            tiles[currentLetters.length].innerText = event.key

            gameTiles[currentLetters.length].setAttribute('letter', event.key)

            popTile(tiles[currentLetters.length])
        }
    })
})()