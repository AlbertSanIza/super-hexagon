import type { Types } from 'phaser'
import { AUTO, Game } from 'phaser'

import { Game as MainGame } from '@/game/scenes/Game'
import { Menu } from '@/game/scenes/Menu'
import { Score } from '@/game/scenes/Score'

const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#682207',
    scene: [MainGame, Menu, Score],
    physics: { default: 'arcade', arcade: { debug: false } }
}

const StartGame = (parent: string) => {
    return new Game({ ...config, parent })
}

export default StartGame
