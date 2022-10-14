const em = { type: 'empty', value: 0 }
const bn = { type: 'block', value: null }
const b0 = { type: 'block', value: 0 }
const b1 = { type: 'block', value: 1 }
const b2 = { type: 'block', value: 2 }
const b3 = { type: 'block', value: 3 }
const b4 = { type: 'block', value: 4 }

export const stage_01 = {
    name: 'easy',
    matrix: [
        [em, em, em, b1, em, em, em,],
        [em, b0, em, em, em, b2, em,],
        [em, em, em, em, em, em, em,],
        [bn, em, em, bn, em, em, bn,],
        [em, em, em, em, em, em, em,],
        [em, bn, em, em, em, b2, em,],
        [em, em, em, b3, em, em, em,],
    ]
}

export const stage_02 = {
    name: 'medium',
    matrix: [
        [em, em, b0, em, bn, em, em,],
        [em, em, em, em, em, em, em,],
        [bn, em, bn, em, b3, em, bn,],
        [em, em, em, b1, em, em, em,],
        [b2, em, bn, em, bn, em, bn,],
        [em, em, em, em, em, em, em,],
        [em, em, bn, em, b2, em, em,],
    ]
}

export const stage_03 = {
    name: 'hard',
    matrix: [
        [em, bn, em, em, em, em, em, em, em, em,],
        [em, em, em, em, em, b3, em, b2, em, bn,],
        [em, b0, bn, em, em, em, em, bn, em, em,],
        [em, em, em, em, bn, em, em, em, em, em,],
        [em, b1, em, em, bn, b1, bn, em, em, em,],
        [em, em, em, bn, bn, bn, em, em, b3, em,],
        [em, em, em, em, em, bn, em, em, em, em,],
        [em, em, b1, em, em, em, em, b0, bn, em,],
        [b3, em, bn, em, b0, em, em, em, em, em,],
        [em, em, em, em, em, em, em, em, b0, em,],
    ]
}