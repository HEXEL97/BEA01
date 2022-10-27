const type_block = 'block'
const type_empty = 'empty'
const type_light = 'light'

export class Stage {

    matrix = undefined
    name = undefined

    lamp_matrix = null
    time = 0

    constructor(stage = undefined) {

        this.matrix = JSON.parse(JSON.stringify(stage.matrix))
        this.setCoords()
        this.name = stage.name

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

    static create(height, width) {
        const stage = {
            name: 'custom',
            matrix: [],
        }
        for (let i = 0; i < height; i++) {
            const row = []
            for (let j = 0; j < width; j++) {
                row.push({ type: type_empty, value: 0 })
            }
            stage.matrix.push(row)
        }
        return new Stage(stage)
    }

    export() {
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