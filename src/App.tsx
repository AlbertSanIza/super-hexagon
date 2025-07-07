import { useRef } from 'react'

import type { IRefPhaserGame } from '@/Phaser'
import { PhaserGame } from '@/Phaser'

export default function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null)

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0ABAB5]">
            <PhaserGame ref={phaserRef} />
        </div>
    )
}
