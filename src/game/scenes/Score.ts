import { Scene } from 'phaser'

import { loadBestScore, saveBestScore } from '@/lib/score-storage'

export class Score extends Scene {
    private text!: Phaser.GameObjects.Text

    constructor() {
        super({ key: 'Score', active: true })
    }

    create() {
        loadBestScore().then((score) => {
            this.text = this.add
                .text(16, 10, `BEST TIME: ${score.toFixed(2)}`, { fontSize: '22px', fontStyle: 'bold', fontFamily: 'monospace' })
                .setOrigin(0, 0)
        })
        this.game.events.on('updateScore', (newScore: string) => {
            this.text.setText(`BEST TIME: ${newScore}`)
            saveBestScore(parseFloat(newScore))
        })
    }
}
