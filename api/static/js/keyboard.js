(() => {
    const keyboard = document.getElementById('keyboard');
    const keys = keyboard.querySelectorAll('button');
    keys.forEach(btn => {
        btn.onclick = () => {
            const key = btn.getAttribute('data-key')
            const keyCode = btn.getAttribute('data-key').charCodeAt()

            document.dispatchEvent(new KeyboardEvent('keydown', {
                key,
                keyCode,
                bubbles: true,
                cancelable: true,
                shiftKey: false,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                repeat: false,
            }));
        }
    })

    // If the user presses a key on their keyboard, instead of the on-screen keyboard, still animate the key
    document.addEventListener('keydown', (e) => {
        if(!e.isTrusted) return // Ignore synthetic events from on-screen keyboard
        const key = e.key
        
        const keyBtn = keyboard.querySelector(`button[data-key="${key}"]`)
        if (!keyBtn) return
        keyBtn.setAttribute('data-active', 'true')
        const keyUp = document.addEventListener('keyup', (e) => {
            if (key === e.key) {
                keyBtn.removeAttribute('data-active')
                document.removeEventListener('keyup', keyUp)
            }
        })
    })
})()