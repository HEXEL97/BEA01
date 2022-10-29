import { Tools } from "./tools.js"
import { Stage } from "./stage.js"
import { ScoreBoard } from "./scoreboard.js"
import * as stages_import from "./stages.js"

const type_block = 'block'
const type_empty = 'empty'
const type_light = 'light'

const mode_play = 'play'
const mode_edit = 'edit'
const mode_test = 'test'

const countdown_seconds = 1

const create = (type) => { return document.createElement(type) }

export class GameUI {

    // instance of Game

    game = undefined

    // main container

    container = undefined

    // game UI elements

    game_container = undefined
    game_element = undefined
    play_area = undefined
    back_button = undefined

    // removable UI elements

    restart_button = undefined
    save_button = undefined
    timer_element = undefined
    tooltip_element = undefined
    scoreboard_element = undefined

    tooltip_edit = "use arrow up / down to change size<br>press space to start testing"
    tooltip_test = "press space to stop testing"

    // completely separate views from the game itself

    name_editor = undefined
    stage_selector = undefined
    countdown_page = undefined

    constructor(game, container) {

        this.game = game

        if (!container instanceof HTMLElement) {
            throw `Container must be instance of HTMLElement, ${typeof (container)} passed.`
        }

        this.container = container

        this.game_container = document.createElement('div')
        this.game_container.classList.add('game-wrapper')

        this.game_element = document.createElement('div')
        this.game_element.classList.add('play-area')

        const action_buttons = document.createElement('div')
        action_buttons.classList.add('actions')

        this.back_button = document.createElement('button')
        this.back_button.innerText = "< back"
        this.back_button.addEventListener('click', () => {
            this.game.stopTimer(true)
            this.view(this.getStageSelector())
        })
        action_buttons.appendChild(this.back_button)

        this.restart_button = document.createElement('button')
        this.restart_button.innerText = "[restart]"
        this.restart_button.addEventListener('click', () => { this.game.restart() })
        action_buttons.appendChild(this.restart_button)

        this.save_button = document.createElement('button')
        this.save_button.innerText = "[save]"
        this.save_button.addEventListener('click', () => { this.game.saveStage() })
        action_buttons.appendChild(this.save_button)


        this.game_element.appendChild(action_buttons)

        this.timer_element = document.createElement('h1')
        this.timer_element.classList.add('timer')
        this.timer_element.innerText = '00:00'

        this.game_element.appendChild(this.timer_element)

        this.tooltip_element = document.createElement('p')
        this.tooltip_element.classList.add('tooltip')
        this.setTooltip(this.tooltip_edit)
        this.game_element.appendChild(this.tooltip_element)

        this.scoreboard_element = document.createElement('div')
        this.scoreboard_element.classList.add('scoreboard')

        this.game_container.appendChild(this.scoreboard_element)

        this.game_container.appendChild(this.game_element)

        this.stages = Object.values(stages_import)

        window.addEventListener('keydown', (event) => {
            this.game.handleKeyDown(event.code)
        })

    }

    view(element) {
        this.container.classList.add('fade')
        setTimeout(() => {
            this.container.innerHTML = null
            this.container.appendChild(element)
            setTimeout(() => {
                this.container.classList.remove('fade')
            }, 500)
        }, 500)

    }

    showElements(elements) {
        elements.forEach(element => {
            if (element.style.display === 'none') {
                element.style.display = element.data.display_mode
                console.log([element.innerHTML, element.style.display])
            }
        })
    }

    hideElements(elements) {
        elements.forEach(element => {
            element.data = {
                display_mode: (element.style.display !== 'none') ? element.style.display : 'block'
            }
            element.style.display = 'none'
        })
    }

    getGameModeElements(mode) {
        switch (mode) {
            case mode_play:
                return [
                    this.restart_button,
                    this.timer_element,
                    this.scoreboard_element,
                ]
            case mode_edit:
                return [
                    this.save_button,
                    this.tooltip_element,
                ]
            case mode_test:
                return [
                    this.restart_button,
                    this.tooltip_element,
                ]
        }
    }

    getRemovableElements() {
        return [
            this.restart_button,
            this.save_button,
            this.timer_element,
            this.tooltip_element,
            this.scoreboard_element,
        ]
    }

    setTooltip(text) {
        this.tooltip_element.innerHTML = text
    }

    setMode(mode) {

        this.hideElements(this.getRemovableElements())
        this.showElements(this.getGameModeElements(mode))

        this.game_container.classList.remove('test')

        switch (mode) {
            case mode_test:
                this.setTooltip(this.tooltip_test)
                break
            case mode_edit:
                this.game_container.classList.add('test')
                this.setTooltip(this.tooltip_edit)
                this.setFinished(false)
                break

        }
    }

    renderGameElement() {

        this.play_area = document.createElement('div')
        this.play_area.id = 'game'
        this.play_area.classList.add('game')

        const prev_render = this.game_element.querySelector('#game')
        if (prev_render !== null) {
            prev_render.remove()
        }

        this.game_element.appendChild(this.play_area)

    }

    renderStageMatrix(matrix) {

        const width = `${Math.ceil(100 / matrix.length)}%`
        const height = `${Math.ceil(100 / matrix[0].length)}%`

        this.play_area.style.fontSize = `${Math.ceil(100 / matrix[0].length) * 2}px`

        matrix.forEach(row => {

            const row_element = document.createElement('div')
            row_element.classList.add('board-row')
            row_element.style.height = height

            row.forEach(cell => {

                cell.element = document.createElement('div')
                cell.element.classList.add('board-cell')
                cell.element.style.width = width

                cell.element.addEventListener('click', () => { this.game.handleClick(cell) })

                switch (cell.type) {
                    case type_block:
                        cell.element.classList.add('block')
                        if (cell.value === 0) {
                            cell.element.classList.add('happy')
                        }
                        cell.element.innerText = cell.value
                        break
                    case type_light:
                        cell.element.innerText = '*'
                        if (cell.value > 1) {
                            cell.overloaded = true
                            cell.element.classList.add('stressed')
                        }
                    case type_empty:
                        cell.element.classList.add('empty')
                        if (cell.value > 0) {
                            cell.element.classList.add('lumos')
                        }
                        break;
                }

                row_element.appendChild(cell.element)

            })

            this.play_area.appendChild(row_element)

        })

    }

    updateScoreBoard(scores) {
        this.scoreboard_element.innerHTML = null
        scores.forEach(score => {
            const score_element = document.createElement('div')
            score_element.classList.add('score')
            score_element.innerHTML = `<div>${score.player_name}</div><div>${Tools.toTime(score.seconds)}</div>`
            this.scoreboard_element.appendChild(score_element)
        })
    }

    updateTimer(time) {
        this.timer_element.classList.remove('happy')
        this.timer_element.innerHTML = `<h1>${Tools.toTime(time)}</h1>`
    }

    setFinished(finished) {
        if (finished) {
            this.timer_element.classList.add('happy')
            this.game_container.classList.add('ggez')
        } else {
            this.timer_element.classList.remove('happy')
            this.game_container.classList.remove('ggez')
        }
    }

    getMenuComponent() {
        const menu = document.createElement('div')
        menu.classList.add('menu')
        return menu
    }

    countdown(seconds, fn) {
        if (this.countdown_page === undefined) {
            const countdown_page = this.getMenuComponent()
            this.countdown_page = countdown_page
        }
        this.countdown_page.innerText = `<h1>Ready?</h1>`
        for (let i = seconds + 1; i > 0; i--) {
            setTimeout(() => {
                this.countdown_page.innerHTML = `<h1>${i}</h1>`
            }, (seconds - i + 1) * 1000 - 500)
        }
        this.view(this.countdown_page)
        setTimeout((i) => { fn() }, (seconds) * 1000)
    }

    getSaveData() {
        return this.stages.map(stage => {
            return { name: stage.name, data: Tools.getCookie(stage.name) }
        }).filter(save => save !== null)
    }

    getNameEditor() {
        if (this.name_editor === undefined) {

            const name_editor = this.getMenuComponent()

            const greeting = create('h1')
            greeting.innerText = this.game.player_name === null ? 'And you must be...?' : 'A new challenger aproaches!'
            name_editor.appendChild(greeting)

            const name_input = create('input')
            name_input.maxLength = 6
            name_editor.appendChild(name_input)

            const hint = create('p')
            hint.innerText = 'press enter to continue'
            name_editor.appendChild(hint)

            name_editor.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    if (name_input.value === "") {
                        greeting.innerText = "Don't be shy, tell me your name!"
                    } else {
                        this.game.setPlayerName(name_input.value.toUpperCase())
                        this.view(this.getStageSelector())
                    }
                }
            })

            this.name_editor = name_editor

        }
        return this.name_editor
    }

    getStageSelector() {

        const stage_selector = this.getMenuComponent()
        stage_selector.classList.add("stage-selector")

        const stage_list = document.createElement('div')
        stage_list.classList.add('stage-container')

        const stage_preview = document.createElement('div')
        stage_preview.classList.add('stage-preview')

        const setPreview = (stage, save) => {

            stage_preview.innerHTML = null

            stage_preview.innerHTML = `<h1>${stage.name}</h1>`

            const new_game_button = document.createElement('button')
            new_game_button.innerText = 'new game'
            new_game_button.addEventListener('click', () => {
                this.countdown(countdown_seconds, () => {
                    this.game.setMode(mode_play)
                    this.game.setStage(stage)
                    this.view(this.game_container)
                })
            })
            stage_preview.appendChild(new_game_button)

            if (save.data !== null) {
                const continue_game_button = document.createElement('button')
                continue_game_button.innerText = 'continue game'
                continue_game_button.addEventListener('click', () => {
                    this.countdown(countdown_seconds, () => {
                        stage.setSaveData(save)
                        this.game.setMode(mode_play)
                        this.game.setStage(stage)
                        this.view(this.game_container)
                    })
                })
                stage_preview.appendChild(continue_game_button)
            }

            const scoreboard_element = document.createElement('div')
            scoreboard_element.classList.add('scoreboard')
            scoreboard_element.classList.add('preview')
            const scoreboard = ScoreBoard.getScores(stage.name)

            if (scoreboard !== undefined) {

                const scores = scoreboard.scores
                scores.slice(0, 3).forEach((score, index) => {
                    const score_element = document.createElement('div')
                    score_element.classList.add('score')
                    score_element.innerHTML = `<div>#${index + 1}</div><div>${score.player_name}</div><div>${Tools.toTime(score.seconds)}</div>`
                    scoreboard_element.appendChild(score_element)
                })
            }

            stage_preview.appendChild(scoreboard_element)

        }

        const saves = this.getSaveData()

        this.stages.forEach((stage) => {

            const stage_button = create('button')

            stage = new Stage(stage)

            const save = saves.find(save => save.name === stage.name)

            stage_button.innerText = stage.name

            stage_button.addEventListener('click', () => {
                document.querySelectorAll('button.active').forEach(button => {
                    button.classList.remove('active')
                })
                stage_button.classList.add('active')
                setPreview(stage, save)
            })

            stage_list.appendChild(stage_button)

        })

        const stage_create = create('button')

        stage_create.innerText = '+ create new'

        stage_create.addEventListener('click', () => {
            this.game.setMode(mode_edit)
            this.game.setStage(Stage.create(5, 5))
            this.view(this.game_container)
        })

        stage_list.append(stage_create)

        stage_selector.appendChild(stage_list)
        stage_selector.appendChild(stage_preview)

        const player_name = document.createElement('div')
        player_name.classList.add('player-name')
        player_name.innerHTML = `<h1>${this.game.player_name}</h1>`
        player_name.addEventListener('click', () => {
            this.view(this.getNameEditor())
        })
        stage_selector.appendChild(player_name)


        this.stage_selector = stage_selector

        return this.stage_selector
    }

}