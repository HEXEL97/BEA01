import { Menu } from "./menu.js"
import { Stage } from "./stage.js"

const type_block = 'block'
const type_empty = 'empty'
const type_light = 'light'

const dark = 0

export class Game {

    container = undefined // all-purpose container element
    stage = undefined // selected stage (level) of the game
    stage_default = undefined // stage default state for reload purposes

    game_element = undefined // element of the play area
    timer_element = undefined // display for time wasted

    player_name = undefined // probably some awesome dude (or gal)
    valid = false // game solve status

    timer = false // it's like a watch!
    seconds = 0 // seconds wasted

    saves = [] // self-explanatory

    flow_rate = 50 // light flow speed (ms)

    constructor(container = undefined) {

        if (!container instanceof HTMLElement) {
            throw `Container must be instance of HTMLElement, ${typeof (container)} passed.`
        }

        this.container = container
        this.game_element = document.createElement('div')
        this.game_element.classList.add('play-area')

        const action_buttons = document.createElement('div')
        action_buttons.classList.add('actions')

        const back_button = document.createElement('button')
        back_button.innerText = "< back"
        back_button.addEventListener('click', () => {
            this.stopTimer()
            this.show(this.menu.getStageSelector())
        })
        action_buttons.appendChild(back_button)

        const restart_button = document.createElement('button')
        restart_button.innerText = "[restart]"
        restart_button.addEventListener('click', () => { this.restart() })
        action_buttons.appendChild(restart_button)

        this.game_element.appendChild(action_buttons)

        this.timer_element = document.createElement('h1')
        this.timer_element.classList.add('timer')
        this.timer_element.innerText = '00:00'

        this.game_element.appendChild(this.timer_element)

        this.menu = new Menu(this)

    }

    show(element = this.game_element) {
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
        this.player_name = this.getCookie('playername')
        if (this.player_name === undefined) {
            this.show(this.menu.getNameEditor())
        } else {
            this.show(this.menu.getStageSelector())
        }
    }

    setPlayerName(name) {
        this.player_name = name
        this.setCookie('playername', this.player_name)
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

    setCookie(name, value) {
        const d = new Date();
        d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expires = "expires=";
        document.cookie = name + "=" + JSON.stringify(value) + "; " + expires;
    }

    getCookie(name) {
        const value = document.cookie.split('; ').map(cookie => { return { name: cookie.split('=')[0], value: cookie.split('=')[1] } }).filter(cookie => cookie.name === name)
        return value.length > 0 ? (value instanceof Object ? value : JSON.parse(value)) : undefined
    }

    saveGame() {
        this.setCookie(this.stage.name, this.stage.export())
    }

    saveScore() {
        let scoreboard = this.getCookie('scoreboard')

        if (scoreboard === undefined) scoreboard = []
        if (scoreboard[this.stage.name] === undefined) scoreboard[this.stage.name] = []

        scoreboard[this.stage.name].push({ time: this.seconds, name: this.player_name })

        this.setCookie('scoreboard', scoreboard)
    }

    deleteSave() {
        document.cookie = `${this.stage.name}=null; expires=0`
    }

    loadSave() {
        if (this.saves === undefined) return
        const save = this.saves.find(save => save.name === this.stage.name)
        if (save === undefined) return
        let i = 0
        save.data.forEach(y => {
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

        const prev_render = this.game_element.querySelector('#game')
        if (prev_render !== null) {
            prev_render.remove()
        }

        this.game_element.appendChild(game)

        setTimeout(() => { this.loadSave() }, 500)

        this.startTimer()

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

    getLampCount() {
        return this.stage.matrix.map(row => {
            return row.filter(cell => cell.type === type_light).length
        }).reduce((last, sum) => last + sum, 0)
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
        const toTime = (seconds, units = [60, 60, 24]) => {
            const unit = units.shift()
            let time = Math.floor(seconds % unit).toString()
            time = '0'.repeat(unit.toString().length - time.length) + time
            return (units.length > 0) ? time = toTime(Math.floor(seconds / unit), units) + ':' + time : time
        }
        this.timer_element.innerHTML = `<h1>${toTime(seconds)}</h1>`
        this.timer = setTimeout(() => {
            this.startTimer(seconds + 1)
        }, 1000)
    }

    stopTimer() {
        this.timer_element.classList.add('happy')
        clearTimeout(this.timer)
    }

    validate() {

        this.valid = this.isValid()
        if (this.valid) {
            this.deleteSave()
            this.stopTimer()
            this.game_element.classList.add('ggez')
            this.saveScore()
        } else {
            if (this.getLampCount() === 0) {
                this.deleteSave()
            } else {
                this.saveGame()
            }
            this.game_element.classList.remove('ggez')
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