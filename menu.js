import { Game } from "./game.js"
import { Stage } from "./stage.js"
import * as stages_import from "./stages.js"

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

        this.renderComponents()

    }

    renderComponents() {

        const create = (type) => { return document.createElement(type) }

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

        if (this.stage_selector === undefined) {

            const stage_selector = this.getMenuComponent()
            stage_selector.classList.add("stage-selector")

            this.game.saves = this.getSaveData()

            this.stages.forEach((stage) => {

                const stage_button = create('button')

                stage = new Stage(stage)

                const save = this.game.saves.find(save => save.name === stage.name)

                if (save !== undefined) {
                    stage_button.innerText = `${stage.name} (continue)`
                } else {
                    stage_button.innerText = stage.name
                }

                stage_button.addEventListener('click', () => {
                    this.countdown(0, () => {
                        this.game.setStage(stage)
                        this.game.show()
                    })
                })

                stage_selector.appendChild(stage_button)

            })


            this.stage_selector = stage_selector

        }

        if (this.countdown_page === undefined) {
            const countdown_page = this.getMenuComponent()
            this.countdown_page = countdown_page
        }

    }

    getMenuComponent() {
        const menu = document.createElement('div')
        menu.classList.add('menu')
        return menu
    }

    countdown(seconds, fn) {
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
        this.stages.forEach(stage => {
            console.log(this.game.getCookie(stage.name))
        })
        /*
        if (document.cookie !== "") {
            return document.cookie.split(';').map(save => {
                save = save.split('=')
                return {
                    name: save[0].replace(' ', ''),
                    data: save[1] !== 'null' ? JSON.parse(save[1]) : null,
                }
            }).filter(save => {
                return save.data !== null
            })
        }
        return []
        */
    }

    getNameEditor() {
        return this.name_editor
    }

    getStageSelector() {
        this.stage_selector = undefined
        this.renderComponents()
        return this.stage_selector
    }

}