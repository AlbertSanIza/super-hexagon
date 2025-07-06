import { useRef } from 'react'

import type { IRefPhaserGame } from '@/PhaserGame'
import { PhaserGame } from '@/PhaserGame'

export default function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null)

    return (
        <div className="fixed inset-0 items-center justify-center bg-orange-50">
            <PhaserGame ref={phaserRef} />
        </div>
    )
}
