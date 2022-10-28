import { Tools } from "./tools.js"
import { Stage } from "./stage.js"
import { ScoreBoard } from "./scoreboard.js"
import { GameUI } from "./ui.js"

const type_block = 'block'
const type_empty = 'empty'
const type_light = 'light'

const mode_play = 'play'
const mode_edit = 'edit'
const mode_test = 'test'

const dark = 0

export class Game {

    container = undefined // all-purpose container element
    stage = undefined // selected stage (level) of the game
    stage_default = undefined // stage default state for reload purposes

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
        this.backupStage(default_stage)

        this.valid = false

        this.render(() => {
            setTimeout(() => {
                this.loadSave()
                this.startTimer(this.seconds)
            }, 500)

            this.validate()
        })

    }

    backupStage(stage = undefined) {
        this.stage_default = stage === undefined ? new Stage(JSON.parse(JSON.stringify(this.stage))) : stage
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
        this.view(this.ui.game_container)
    }

    saveStage() {
        console.log(this.stage.serialize())
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
            case mode_test:

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

                switch (cell.type) {
                    case type_empty:
                        this.setType(cell, type_light)
                        spread(cell, this.illuminate)
                        this.getNeighbours(cell).filter(neighbour => neighbour.type === type_block).forEach(block => { this.decrease(block) })
                        this.validate()
                        break
                    case type_light:
                        this.setType(cell, type_empty)
                        spread(cell, this.extinguish)
                        this.getNeighbours(cell).filter(neighbour => neighbour.type === type_block).forEach(block => { this.increase(block) })
                        this.validate()
                        break
                }

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
        if (this.mode !== mode_play) {
            switch (keycode) {
                case 'ArrowUp':
                    if (this.mode == mode_edit) this.stage.grow()
                    break
                case 'ArrowDown':
                    if (this.mode == mode_edit) this.stage.shrink()
                    break
                case 'Space':
                    switch (this.mode) {
                        case mode_test:
                            this.setMode(mode_edit)
                            this.stage.sanitize()
                            break
                        case mode_edit:
                            this.setMode(mode_test)
                            break
                    }
                    break
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
        this.ui.game_container.classList.remove('test')
        switch (mode) {
            case mode_test:
                this.ui.showElement(this.ui.restart_button)
                this.ui.getEditModeElements().forEach(element => { this.ui.hideElement(element) })
                break
            case mode_play:
                this.ui.getPlayModeElements().forEach(element => { this.ui.showElement(element) })
                this.ui.getEditModeElements().forEach(element => { this.ui.hideElement(element) })
                this.ui.game_container.classList.remove('test')
                break
            case mode_edit:
                this.ui.getEditModeElements().forEach(element => { this.ui.showElement(element) })
                this.ui.getPlayModeElements().forEach(element => { this.ui.hideElement(element) })
                this.ui.game_container.classList.add('test')
                this.ui.setFinished(false)
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
        if (this.mode == mode_play) {
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