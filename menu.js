import { Game } from "./game.js"
import { Stage } from "./stage.js"
import { Tools } from "./tools.js"
import { ScoreBoard } from "./scoreboard.js"
import * as stages_import from "./stages.js"

const create = (type) => { return document.createElement(type) }

export class Menu {

    game = undefined
    name_editor = undefined
    stage_selector = undefined
    countdown_page = undefined

    constructor(game = undefined) {

        if (!game instanceof Game) {
            throw `Container must be instance of Game, ${typeof (container)} passed.`
        }

        this.game = game

        this.stages = Object.values(stages_import)

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
        this.game.show(this.countdown_page)
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
                        this.game.show(this.getStageSelector())
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
                this.countdown(3, () => {
                    this.game.setStage(stage)
                    this.game.show()
                })
            })
            stage_preview.appendChild(new_game_button)

            if (save.data !== null) {
                const continue_game_button = document.createElement('button')
                continue_game_button.innerText = 'continue game'
                continue_game_button.addEventListener('click', () => {
                    this.countdown(3, () => {
                        stage.setSaveData(save)
                        this.game.setStage(stage)
                        this.game.show()
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
            this.game.show()
        })

        stage_list.append(stage_create)

        stage_selector.appendChild(stage_list)
        stage_selector.appendChild(stage_preview)

        const player_name = document.createElement('div')
        player_name.classList.add('player-name')
        player_name.innerHTML = `<h1>${this.game.player_name}</h1>`
        player_name.addEventListener('click', () => {
            this.game.show(this.getNameEditor())
        })
        stage_selector.appendChild(player_name)


        this.stage_selector = stage_selector

        return this.stage_selector
    }

}