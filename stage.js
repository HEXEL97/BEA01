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
        this.name = stage.name

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

    static create() {

    }

}