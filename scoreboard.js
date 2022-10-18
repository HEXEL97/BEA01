import { Tools } from "./tools.js"

export class ScoreBoard {


    static saveScore(stage_name, player_name, seconds) {

        const scoreboard = ScoreBoard.getScoreBoard()

        if (scoreboard.findIndex(scoreboard => { return scoreboard.stage_name === stage_name }) === -1) {
            scoreboard.push({ stage_name: stage_name, scores: [] })
        }

        const scores = scoreboard.find(scoreboard => { return scoreboard.stage_name === stage_name }).scores
        scores.push({
            player_name: player_name,
            seconds: seconds
        })
        scores.sort((a, b) => a.seconds - b.seconds)
        Tools.setCookie('scoreboard', scoreboard)

        return scores

    }

    static getScoreBoard() {
        return Tools.getCookie('scoreboard') ?? []
    }

    static getScores(stage_name) {
        return ScoreBoard.getScoreBoard().find(scoreboard => scoreboard.stage_name === stage_name)
    }

}