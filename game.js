import { ScoreBoard } from "./scoreboard.js"
import { Stage } from "./stage.js"
import { Tools } from "./tools.js"
import * as stages_import from "./stages.js"

const type_block = 'block'
const type_empty = 'empty'
const type_light = 'light'

const mode_play = 'play'
const mode_edit = 'edit'

const dark = 0

const create = (type) => { return document.createElement(type) }

export class Game {

    container = undefined // all-purpose container element
    stage = undefined // selected stage (level) of the game
    stage_default = undefined // stage default state for reload purposes

    /*
    game_container = undefined // element of all the game elements
    play_area = undefined // element for the game itself
    timer_element = undefined // display for time wasted
    */

    mode = mode_play // play area mode (play / edit)

    player_name = undefined // probably some awesome dude (or gal)
    valid = false // game solve status

    timer = false // it's like a watch!
    seconds = 0 // seconds wasted

    flow_rate = 50 // light flow speed (ms)

    constructor(container = undefined) {

        if (!container instanceof HTMLElement) {
            throw `Container must be instance of HTMLElement, ${typeof (container)} passed.`
        }

        this.container = container

        this.ui = new GameUI(this, container)

    }

    initialize() {

        this.player_name = Tools.getCookie('playername')
        if (this.player_name === null) {
            this.ui.view(this.ui.getNameEditor())
        } else {
            this.ui.view(this.ui.getStageSelector())
        }

    }

    setPlayerName(name) {
        this.player_name = name
        Tools.setCookie('playername', this.player_name, 1)
    }

    setStage(stage, default_stage = undefined) {

        if (!stage instanceof Stage) {
            throw `Stage must be instance of Stage, ${typeof (stage)} passed.`
        }

        this.stage = stage
        this.stage_default = default_stage === undefined ? new Stage(JSON.parse(JSON.stringify(stage))) : default_stage

        this.valid = false

        this.render(() => {
            setTimeout(() => {
                this.loadSave()
                this.startTimer(this.seconds)
            }, 500)

            this.validate()
        })

    }

    saveGame() {
        Tools.setCookie(this.stage.name, {
            lamp_matrix: this.stage.export(),
            seconds: this.seconds,
        })
    }

    deleteSave() {
        Tools.setCookie(this.stage.name, null, 0)
    }

    loadSave() {
        const save = this.stage.getLampMatrix()
        this.seconds = this.stage.getSaveSeconds()
        if (save === null) return
        let i = 0
        save.forEach(y => {
            y[1].forEach(x => {
                setTimeout(() => {
                    this.handleClick(this.stage.matrix[y[0]][x])
                }, (50 * i++))
            })
        })
    }

    restart() {
        setTimeout(() => {
            this.stopTimer()
            this.setStage(this.stage_default)
        }, 500)
        this.view(this.ui.game_container) // ???
    }

    saveScore() {

        const scoreboard = ScoreBoard.saveScore(this.stage.name, this.player_name, this.seconds)
        this.updateScore()

    }

    updateScore() {

        const scoreboard = ScoreBoard.getScores(this.stage.name);
        if (scoreboard !== undefined) {
            this.ui.updateScoreBoard(scoreboard.scores)
        }

    }

    render(_callback = () => { }) {

        this.ui.renderGameElement()

        if (this.stage !== undefined) {

            this.ui.renderStageMatrix(this.stage.getMatrix())
            this.updateScore()

        }

        _callback()

    }

    handleClick(cell) {

        switch (this.mode) {
            case mode_play:
                this.setType(cell, cell.type === type_empty ? type_light : type_empty)

                const spread = (origin, fn) => {

                    let directions = this.getRange(origin)
                    for (let i = 0; i < Math.max(...directions.map(direction => direction.length)); i++) {
                        directions.forEach(direction => {
                            if (direction[i] !== undefined) {
                                fn(direction[i], i * this.flow_rate)
                            }
                        })
                    }

                }

                if (cell.type === type_light) {

                    spread(cell, this.illuminate)
                    this.getNeighbours(cell).filter(neighbour => neighbour.type === type_block).forEach(block => { this.decrease(block) })

                } else {

                    spread(cell, this.extinguish)
                    this.getNeighbours(cell).filter(neighbour => neighbour.type === type_block).forEach(block => { this.increase(block) })

                }

                this.validate()
                break
            case mode_edit:
                switch (cell.type) {
                    case type_empty:
                        cell.type = type_block
                        cell.value = null
                        break
                    case type_block:
                        if (cell.value < 4) {
                            cell.value++
                        } else {
                            cell.value = 0
                            cell.type = type_empty
                        }
                        break
                }
                this.render()
                break
        }
    }

    handleKeyDown(keycode) {
        if (this.mode == mode_edit) {
            switch (keycode) {
                case 'ArrowUp':
                    this.stage.grow()
                    break
                case 'ArrowDown':
                    this.stage.shrink()
                    break
                default:
                    console.log(keycode)
            }
            this.render()
        }
    }

    setType(cell, type) {
        cell.type = type
        switch (type) {
            case type_light:
                cell.element.innerText = '*'
                this.illuminate(cell)
                break
            case type_empty:
                cell.element.innerText = ''
                cell.element.classList.remove('stressed')
                cell.overloaded = false
                this.extinguish(cell)
                break
            case type_block:
                cell.element.innerText = cell.value
                break
        }
    }

    setMode(mode) {
        this.mode = mode;
        switch (mode) {
            case mode_play:
                this.ui.getPlayModeElements().forEach(element => { this.ui.showElement(element) })
                this.ui.getEditModeElements().forEach(element => { this.ui.hideElement(element) })
                break
            case mode_edit:
                this.stage = undefined
                this.ui.getEditModeElements().forEach(element => { this.ui.showElement(element) })
                this.ui.getPlayModeElements().forEach(element => { this.ui.hideElement(element) })
                break
        }
    }

    setValue(cell, value) {
        cell.value = value
        if (cell.type == type_block) {
            cell.element.classList.remove('stressed')
            cell.element.classList.remove('happy')
            if (cell.value < 0) {
                cell.element.classList.add('stressed')
            } else if (cell.value === 0) {
                cell.element.classList.add('happy')
            }
        }
    }

    getRange(cell) {
        const col = this.stage.matrix.map(row => row.filter((c, index) => c.x === cell.x)[0])
        const row = this.stage.matrix.filter((row, index) => cell.y === index)[0]

        const up = col.filter(c => c.y < cell.y).reverse()
        const down = col.filter(c => c.y > cell.y)
        const left = row.filter(c => c.x < cell.x).reverse()
        const right = row.filter(c => c.x > cell.x)

        let directions = [up, right, down, left]

        directions.forEach((direction, key) => {
            const block_position = direction.findIndex(c => c.type === type_block)
            if (block_position !== -1) {
                directions[key] = direction.filter((c, index) => { return index < block_position })
            }
        })

        return directions
    }

    getNeighbours(cell) {

        let neighbours = []

        const add = (y, x) => {
            if (this.stage.matrix[y] !== undefined && this.stage.matrix[y][x] !== undefined) {
                neighbours.push(this.stage.matrix[y][x])
            }
        }

        add(cell.y + 1, cell.x)
        add(cell.y, cell.x + 1)
        add(cell.y - 1, cell.x)
        add(cell.y, cell.x - 1)

        return neighbours
    }

    illuminate(cell, delay = 0) {
        cell.value++
        if (cell.type == type_light && cell.value > 1) {
            cell.overloaded = true
            cell.element.classList.add('stressed')
        }
        setTimeout(() => {
            cell.element.classList.add('lumos')
        }, delay)
    }

    extinguish(cell, delay = 0) {
        cell.value--
        if (cell.type === type_light && cell.value === 1) {
            cell.overloaded = false
            cell.element.classList.remove('stressed')
        }
        if (cell.value === dark) {
            setTimeout(() => {
                cell.element.classList.remove('lumos')
            }, delay)
        }

    }

    decrease(block) {
        if (block.value !== null) {
            this.setValue(block, block.value - 1)
            block.element.innerText = block.value
        }
    }

    increase(block) {
        if (block.value !== null) {
            this.setValue(block, block.value + 1)
            block.element.innerText = block.value
        }
    }

    startTimer(seconds = 0) {
        this.seconds = seconds
        this.ui.updateTimer(this.seconds)
        this.timer = setTimeout(() => {
            this.startTimer(seconds + 1)
        }, 1000)
    }

    stopTimer(reset = false) {
        clearTimeout(this.timer)
        if (reset) this.seconds = 0
    }

    validate() {
        this.valid = this.isValid()
        if (this.valid) {
            this.stopTimer()
            this.saveScore()
            this.deleteSave()
        } else {
            if (this.stage.getLampCount() === 0) {
                this.deleteSave()
            } else {
                this.saveGame()
            }
        }
        this.ui.setFinished(this.valid)
        return this.valid

    }

    isValid() {

        return this.stage.matrix.map(row => {
            return row.map(cell => {
                switch (cell.type) {
                    case type_empty: return cell.value > 0
                    case type_block: return [0, null].includes(cell.value)
                    case type_light: return cell.overloaded === undefined || cell.overloaded === false
                }
            }).find(value => value === false)
        }).find(value => value === false) === undefined

    }

    updateOutput() {
        this.output.update('dark_cells', this.dark_cells)
        this.output.update('underloaded_blocks', this.underloaded_blocks)
        this.output.update('overloaded_blocks', this.overloaded_blocks)
        this.output.update('overloaded_lights', this.overloaded_lights)
    }

}

class GameUI {

    game = undefined

    container = undefined


    game_container = undefined
    game_element = undefined

    back_button = undefined
    restart_button = undefined
    timer_element = undefined

    scoreboard_element = undefined
    play_area = undefined


    game = undefined

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
        this.restart_button.addEventListener('click', () => { this.restart() })
        action_buttons.appendChild(this.restart_button)

        this.game_element.appendChild(action_buttons)

        this.timer_element = document.createElement('h1')
        this.timer_element.classList.add('timer')
        this.timer_element.innerText = '00:00'

        this.game_element.appendChild(this.timer_element)

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

    showElement(element) {
        if (element.style.display === 'none') {
            element.style.display = element.data.display_mode
        }
    }

    hideElement(element) {
        element.data = {
            display_mode: element.style.display
        }
        element.style.display = 'none'
    }

    getPlayModeElements() {
        return [
            this.timer_element,
            this.restart_button,
            this.scoreboard_element
        ]
    }

    getEditModeElements() {
        return [

        ]
    }

    renderGameElement() {

        this.play_area = document.createElement('div')
        this.play_area.id = 'game'
        this.play_area.classList.add('game')

        this.game_element.appendChild(this.play_area)

    }

    renderStageMatrix(matrix) {

        const width = `${Math.ceil(100 / matrix.length)}%`
        const height = `${Math.ceil(100 / matrix[0].length)}%`

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

        const prev_render = this.container.querySelector('#game')
        if (prev_render !== null) {
            prev_render.remove()
        }
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
                this.countdown(3, () => {
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
                    this.countdown(3, () => {
                        stage.setSaveData(save)
                        this.game.setMode(mode_play)
                        this.game.setStage(stage)
                        this.view(this.ui.game_container)
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