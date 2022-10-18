import { Game } from "./game.js"
import { Stage } from "./stage.js"
import { Tools } from "./tools.js"
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
            greeting.innerText = 'And you must be...?'
            name_editor.appendChild(greeting)

            const name_input = create('input')
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

        const saves = this.getSaveData()

        this.stages.forEach((stage) => {

            const stage_button = create('button')

            stage = new Stage(stage)

            const save = saves.find(save => save.name === stage.name)

            if (save.data !== null) {
                stage.setSaveData(save)
                console.log(save)
                stage_button.innerText = `${stage.name} (${Tools.toTime(stage.getSaveSeconds())} ${save.player_name})`
            } else {
                stage_button.innerText = stage.name
            }

            stage_button.addEventListener('click', () => {
                this.countdown(3, () => {
                    this.game.setStage(stage)
                    this.game.show()
                })
            })

            stage_selector.appendChild(stage_button)

        })


        this.stage_selector = stage_selector

        return this.stage_selector
    }

}