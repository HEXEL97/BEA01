import { Tools } from "./tools.js"

const type_block = 'block'
const type_empty = 'empty'
const type_light = 'light'

export class Stage {

    matrix = undefined
    name = undefined
    custom = false

    lamp_matrix = null
    time = 0

    static create(height, width, name = undefined) {
        if (name === undefined) {
            let number = 1
            name = `custom #${number}`
            while (Tools.getCookie(name) !== null) { name = `custom #${++number}` }
        }

        console.log(name)

        const stage = {
            name: name,
            matrix: [],
        }
        for (let i = 0; i < height; i++) {
            const row = []
            for (let j = 0; j < width; j++) {
                row.push({ type: type_empty, value: 0 })
            }
            stage.matrix.push(row)
        }
        return new Stage(stage, true)
    }

    static parse(json) {

        const stage = JSON.parse(json)

        stage.matrix = stage.matrix.map((row) => {
            return row.map((cell) => {
                switch (cell) {
                    case 'em': return { type: 'empty', value: 0 }
                    case 'bn': return { type: 'block', value: null }
                    case 'b0': return { type: 'block', value: 0 }
                    case 'b1': return { type: 'block', value: 1 }
                    case 'b2': return { type: 'block', value: 2 }
                    case 'b3': return { type: 'block', value: 3 }
                    case 'b4': return { type: 'block', value: 4 }
                }
                return aliases[cell]
            })
        })

        stage.custom = true

        return stage
    }

    constructor(stage = undefined, custom = false) {

        this.matrix = JSON.parse(JSON.stringify(stage.matrix))
        this.setCoords()
        this.name = stage.name
        this.custom = custom

    }

    setCoords() {
        let y = 0
        let x = 0
        this.matrix.map((row) => {
            row.map((cell) => {
                cell.x = x++
                cell.y = y
            })
            y++
            x = 0
        })
    }

    getSaveData() {
        return this.matrix.map((row, y) => {
            const r = row.map((cell, x) => {
                return cell.type === 'light' ? x : null
            }).filter(cell => cell !== null)
            return r.length > 0 ? [y, r] : null
        }).filter(c => c !== null)
    }

    setMatrix(matrix) {
        this.matrix = matrix
    }

    getMatrix() {
        if (this.matrix === undefined) {
            throw `Matrix is not defined`
        }
        return this.matrix
    }

    getLampCount() {
        return this.matrix.map(row => {
            return row.filter(cell => cell.type === type_light).length
        }).reduce((last, sum) => last + sum, 0)
    }

    getName() {
        return this.name
    }

    setSaveData(save) {
        this.lamp_matrix = save.data.lamp_matrix
        this.seconds = save.data.seconds
    }

    getLampMatrix() {
        return this.lamp_matrix ?? null
    }

    getSaveSeconds() {
        return this.seconds ?? 0
    }

    map(fn) {
        this.matrix = this.matrix.map((row) => {
            return row.map((cell) => {
                return fn(cell)
            })
        })
    }

    sanitize() {
        this.map((cell) => {
            return cell.type === type_block ? cell : { type: type_empty, value: 0, x: cell.x, y: cell.y }
        })
    }

    grow() {
        if (this.matrix.length < 15) {
            this.sanitize()
            const new_row = [];
            for (let i = 0; i < this.matrix.length; i++) {
                new_row.push({ type: type_empty, value: 0 })
            }
            this.matrix.push(new_row)
            this.matrix.forEach(row => {
                row.push({ type: type_empty, value: 0 })
            });
            this.setCoords()
        }
    }

    shrink() {
        if (this.matrix.length > 3) {
            this.sanitize()
            this.matrix.splice(-1)
            this.matrix.forEach(row => {
                row.splice(-1)
            });
            this.setCoords()
        }
    }

    serialize() {
        return JSON.stringify({
            name: this.name,
            custom: this.custom,
            matrix: this.matrix.map(row => {
                return row.map(cell => {
                    switch (cell.type) {
                        case type_block:
                            return `b${cell.value === null ? 'n' : cell.value}`
                        case type_empty:
                        case type_light:
                        default:
                            return 'em'
                    }
                })
            })
        })
    }

}