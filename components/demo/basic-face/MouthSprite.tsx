/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useMemo } from 'react';
import type { WawaViseme } from '../../../hooks/demo/use-face';

// Import all 15 wawa-lipsync mouth SVGs
import MouthSIL from '../mouths/SIL.svg';
import MouthPP from '../mouths/PP.svg';
import MouthFF from '../mouths/FF.svg';
import MouthTH from '../mouths/TH.svg';
import MouthDD from '../mouths/DD.svg';
import MouthKK from '../mouths/kk.svg';
import MouthCH from '../mouths/CH.svg';
import MouthSS from '../mouths/SS.svg';
import MouthNN from '../mouths/nn.svg';
import MouthRR from '../mouths/RR.svg';
import MouthAA from '../mouths/aa.svg';
import MouthE from '../mouths/E.svg';
import MouthI from '../mouths/I.svg';
import MouthO from '../mouths/O.svg';
import MouthU from '../mouths/U.svg';

/**
 * Maps WawaViseme directly to its corresponding mouth sprite
 */
function getMouthSprite(viseme: WawaViseme): string {
    switch (viseme) {
        case 'sil':
            return MouthSIL;
        case 'PP':
            return MouthPP;
        case 'FF':
            return MouthFF;
        case 'TH':
            return MouthTH;
        case 'DD':
            return MouthDD;
        case 'kk':
            return MouthKK;
        case 'CH':
            return MouthCH;
        case 'SS':
            return MouthSS;
        case 'nn':
            return MouthNN;
        case 'RR':
            return MouthRR;
        case 'aa':
            return MouthAA;
        case 'E':
            return MouthE;
        case 'I':
            return MouthI;
        case 'O':
            return MouthO;
        case 'U':
            return MouthU;
        default:
            return MouthSIL;
    }
}

type MouthSpriteProps = {
    viseme: WawaViseme;
    className?: string;
    style?: React.CSSProperties;
};

export default function MouthSprite({ viseme, className, style }: MouthSpriteProps) {
    const mouthSrc = useMemo(() => getMouthSprite(viseme), [viseme]);

    return (
        <img
            src={mouthSrc}
            alt={`Mouth shape for ${viseme}`}
            className={className}
            style={{
                transition: 'opacity 0.05s ease-out',
                ...style,
            }}
            draggable={false}
        />
    );
}
