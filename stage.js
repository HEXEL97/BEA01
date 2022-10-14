export class Stage {

    matrix = undefined
    name = undefined

    save = null

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

    getName() {
        return this.name
    }

}