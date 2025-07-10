import type { Types } from 'phaser'
import { AUTO, Game } from 'phaser'

import { Game as MainGame } from '@/game/scenes/Game'
import { Menu } from '@/game/scenes/Menu'

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    scene: [MainGame, Menu],
    parent: 'game-container',
    backgroundColor: '#682207',
    physics: { default: 'arcade', arcade: { debug: false } }
}

const StartGame = (parent: string) => {
    return new Game({ ...config, parent })
}

export default StartGame
