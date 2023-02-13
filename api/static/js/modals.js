(() => {
    const game = document.getElementById('game');
    const modalClose = document.querySelectorAll('.modal-close');

    const settingsBtn = document.getElementById('settings')
    const settingsModal = document.getElementById('settings-modal')

    const statsBtn = document.getElementById('stats')
    const statsModal = document.getElementById('stats-modal');

    const helpBtn = document.getElementById('help')
    const helpModal = document.getElementById('help-modal');
    const helpExamples = document.getElementById('help-examples');
    const exampleTiles = helpExamples.querySelectorAll('.tile')

    function flipTile(tile) {
        tile.setAttribute('data-animation', 'flip-in')
        setTimeout(() => {
            tile.setAttribute('data-animation', 'flip-out')
            setTimeout(() => {
                tile.setAttribute('data-animation', 'idle')
            }, 250);
        }, 250);
    }

    function closeModal(el) {
        el.classList.remove('open');
        game.classList.remove('hide')
        setTimeout(() => {
            el.style.display = 'none'
        }, 200);
    }

    helpBtn.addEventListener('click', () => {
        if (helpModal.classList.contains('open')) {
            closeModal(helpModal)
            game.classList.remove('hide')
        } else {
            if (helpModal.style.display !== 'flex') {
                closeModal(statsModal)
                closeModal(settingsModal)

                helpModal.style.display = 'flex'
                game.classList.add('hide')

                setTimeout(() => {
                    helpModal.classList.add('open')
                    exampleTiles.forEach(tile => {
                        if (tile.getAttribute('data-state') !== 'tbd') {
                            setTimeout(() => {
                                flipTile(tile)
                            }, 200);
                        }
                    })
                }, 1);
            }

        }
    })
    settingsBtn.addEventListener('click', () => {
        if (settingsModal.classList.contains('open')) {
            closeModal(settingsModal)
            game.classList.remove('hide')
        } else {
            if (settingsModal.style.display !== 'flex') {
                closeModal(statsModal)
                closeModal(helpModal)

                settingsModal.style.display = 'flex'
                game.classList.add('hide')

                setTimeout(() => {
                    settingsModal.classList.add('open')
                }, 1);
            }
        }
    })
    statsBtn.addEventListener('click', () => {
        if (statsModal.classList.contains('open')) {
            game.classList.remove('hide')
            closeModal(statsModal)
        } else {
            if (statsModal.style.display !== 'flex') {
                closeModal(settingsModal)
                closeModal(helpModal)

                game.classList.add('hide')
                statsModal.style.display = 'flex'

                setTimeout(() => { // wait for background to hide and modal to show
                    statsModal.classList.add('open')
                }, 1);

                document.onclick = (e) => { // close modal on click outside
                    if (e.path?.includes(statsModal)) return
                    if (!e.target.id || e.target.id !== 'stats') {
                        document.onclick = null;
                        closeModal(statsModal)
                        game.classList.remove('hide')
                    }
                }
            }
        }
    })
    modalClose.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(helpModal)
            closeModal(settingsModal)
            closeModal(statsModal)
        })
    })

    const modeSelect = document.getElementById('modes-select')
    modeSelect.value = window.localStorage.getItem('mode') || 'english' // preload the mode
    const titleMode = document.getElementById('title-mode') // preload the mode in the title
    titleMode.innerText = modeSelect.value

    modeSelect.addEventListener('change', () => {
        titleMode.innerText = modeSelect.value
        let lclstorageMode = window.localStorage.getItem('mode')
        if (lclstorageMode !== modeSelect.value) {
            window.localStorage.setItem('mode', modeSelect.value)
            window.location.reload()
        }
    })

    let boardState = JSON.parse(window.localStorage.getItem(modeSelect.value + '_boardState')) // get the board state
    const hardModeSwitch = document.getElementById('hard-mode-checkbox')

    hardModeSwitch.checked = boardState ? boardState.hardMode : false // load previous value

    hardModeSwitch.parentNode.addEventListener('click', () => {
        boardState = JSON.parse(window.localStorage.getItem(modeSelect.value + '_boardState'))
        if (boardState.rowIndex !== 0) {
            hardModeSwitch.checked = boardState.hardMode ? true : false
            hardModeSwitch.toggleAttribute('disabled', true)
            return
        } else {
            boardState.hardMode = hardModeSwitch.checked
            window.localStorage.setItem(modeSelect.value + '_boardState', JSON.stringify(boardState))
        }
    })

    // convert ms to hours, minutes, seconds and ms
    function msToTime(duration) {
        var milliseconds = Math.floor((duration % 1000) / 100),
            seconds = Math.floor((duration / 1000) % 60),
            minutes = Math.floor((duration / (1000 * 60)) % 60),
            hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
        return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    }
    const timeText = document.getElementById('time-left')
    const timerFill = document.getElementById('timer-pie')

    function updateTime(nextWordTS) {
        const currentTS = new Date().getTime()
        const timeLeft = nextWordTS - currentTS
        timeText.innerText = msToTime(timeLeft)

        const totalTime = 24 * 60 * 60 * 1000
        const timeLeftPercent = (timeLeft / totalTime) * 100
        timerFill.style.background = `conic-gradient(var(--timer-fill-color) ${100-timeLeftPercent}%, #0000 0)`
    }

    const nextWordTS = new Date().setHours(0, 0, 0, 0) + (24 * 60 * 60 * 1000)
    updateTime(nextWordTS, timeText)
    setInterval(() => {
        if (!statsModal.classList.contains('open')) return // stop updating if the modal is closed, to avoid using up resources
        updateTime(nextWordTS, timeText)
    }, 100);

})()