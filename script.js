import { Game } from "./game.js"

const game_container = document.querySelector('#game-container')

const game = new Game(game_container)
game.initialize()

/*
const stage_display = $('#current-stage')

let selected_stage = undefined

const setStage = (stage) => {
    if (stage !== undefined) {
        stage_display.innerHTML = stage.name
        selected_stage = stage
        game.setStage(new Stage(selected_stage))
    }
}

setStage(stages[0])

const pause_button = $('#pause-button')
const resume_button = $('#resume-button')
const pause_menu = $('#pause-menu')

pause_button.addEventListener('click', () => {
    pause_menu.style.display = 'flex'
    $('#game-container').classList.add('paused')
})
resume_button.addEventListener('click', () => {
    pause_menu.style.display = 'none'
    $('#game-container').classList.remove('paused')
})

const restart_button = $('#restart-button')
const previous_stage_button = $('#previous-stage-button')
const next_stage_button = $('#next-stage-button')

restart_button.addEventListener('click', () => {
    setStage(selected_stage)
})

previous_stage_button.addEventListener('click', () => {
    setStage(stages[stages.findIndex(stage => selected_stage === stage) - 1])
})

next_stage_button.addEventListener('click', () => {
    setStage(stages[stages.findIndex(stage => selected_stage === stage) + 1])
})
*/




