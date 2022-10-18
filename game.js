import { Menu } from "./menu.js"
import { ScoreBoard } from "./scoreboard.js"
import { Stage } from "./stage.js"
import { Tools } from "./tools.js"

const type_block = 'block'
const type_empty = 'empty'
const type_light = 'light'

const dark = 0

export class Game {

    container = undefined // all-purpose container element
    stage = undefined // selected stage (level) of the game
    stage_default = undefined // stage default state for reload purposes

    game_container = undefined // element of all the game elements
    play_area = undefined // element for the game itself
    timer_element = undefined // display for time wasted

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

        this.game_container = document.createElement('div')
        this.game_container.classList.add('game-wrapper')

        this.play_area = document.createElement('div')
        this.play_area.classList.add('play-area')

        const action_buttons = document.createElement('div')
        action_buttons.classList.add('actions')

        const back_button = document.createElement('button')
        back_button.innerText = "< back"
        back_button.addEventListener('click', () => {
            this.stopTimer(true)
            this.show(this.menu.getStageSelector())
        })
        action_buttons.appendChild(back_button)

        const restart_button = document.createElement('button')
        restart_button.innerText = "[restart]"
        restart_button.addEventListener('click', () => { this.restart() })
        action_buttons.appendChild(restart_button)

        this.play_area.appendChild(action_buttons)

        this.timer_element = document.createElement('h1')
        this.timer_element.classList.add('timer')
        this.timer_element.innerText = '00:00'

        this.play_area.appendChild(this.timer_element)

        this.game_container.appendChild(this.play_area)

        this.scoreboard_element = document.createElement('div')
        this.scoreboard_element.classList.add('scoreboard')

        this.game_container.appendChild(this.scoreboard_element)

        this.menu = new Menu(this)

    }

    show(element = this.game_container) {
        this.container.classList.add('fade')
        setTimeout(() => {
            this.container.innerHTML = null
            this.container.appendChild(element)
            setTimeout(() => {
                this.container.classList.remove('fade')
            }, 500)
        }, 500)
    }

    initialize() {
        this.player_name = Tools.getCookie('playername')
        if (this.player_name === null) {
            this.show(this.menu.getNameEditor())
        } else {
            this.show(this.menu.getStageSelector())
        }
    }

    setPlayerName(name) {
        this.player_name = name
        Tools.setCookie('playername', this.player_name)
    }

    setStage(stage, default_stage = undefined) {

        if (!stage instanceof Stage) {
            throw `Stage must be instance of Stage, ${typeof (stage)} passed.`
        }

        this.stage = stage
        this.stage_default = default_stage === undefined ? new Stage(JSON.parse(JSON.stringify(stage))) : default_stage

        this.valid = false

        this.render()

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
                    this.toggleLamp(this.stage.matrix[y[0]][x])
                }, (50 * i++))
            })
        })
    }

    restart() {
        setTimeout(() => {
            this.stopTimer()
            this.setStage(this.stage_default)
        }, 500)
        this.show()
    }

    saveScore() {

        const scoreboard = ScoreBoard.saveScore(this.stage.name, this.player_name, this.seconds)

        this.updateScore()

    }

    updateScore() {

        this.scoreboard_element.innerHTML = null

        const scoreboard = ScoreBoard.getScores(this.stage.name);

        if (scoreboard !== undefined) {

            const scores = scoreboard.scores
            scores.forEach(score => {
                const score_element = document.createElement('div')
                score_element.classList.add('score')
                score_element.innerHTML = `<div>${score.player_name}</div><div>${Tools.toTime(score.seconds)}</div>`
                this.scoreboard_element.appendChild(score_element)
            })
        }


    }

    render() {

        const matrix = this.stage.getMatrix()

        const game = document.createElement('div')
        game.id = 'game'
        game.classList.add('game')

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
                        cell.element.addEventListener('click', () => { this.toggleLamp(cell) })
                        if (cell.value > 0) {
                            cell.element.classList.add('lumos')
                        }
                        break;
                }

                row_element.appendChild(cell.element)

            })

            game.appendChild(row_element)

        })

        const prev_render = this.game_container.querySelector('#game')
        if (prev_render !== null) {
            prev_render.remove()
        }

        this.play_area.appendChild(game)

        this.updateScore()

        setTimeout(() => {
            this.loadSave()
            this.startTimer(this.seconds)
        }, 500)

        this.validate()

    }

    toggleLamp(cell) {

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
        this.timer_element.classList.remove('happy')
        this.timer_element.innerHTML = `<h1>${Tools.toTime(seconds)}</h1>`
        this.timer = setTimeout(() => {
            this.startTimer(seconds + 1)
        }, 1000)
    }

    stopTimer(reset = false) {
        this.timer_element.classList.add('happy')
        clearTimeout(this.timer)
        if (reset) this.seconds = 0
    }

    validate() {
        this.valid = this.isValid()
        if (this.valid) {
            this.game_container.classList.add('ggez')
            this.stopTimer()
            this.saveScore()
            this.deleteSave()
        } else {
            if (this.stage.getLampCount() === 0) {
                this.deleteSave()
            } else {
                this.saveGame()
            }
            this.game_container.classList.remove('ggez')
        }
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