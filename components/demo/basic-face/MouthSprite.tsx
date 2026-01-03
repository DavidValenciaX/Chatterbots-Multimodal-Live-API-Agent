/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useMemo } from 'react';
import type { AdobeViseme } from '../../../hooks/demo/use-face';

// Import all 14 Adobe Character Animator mouth SVGs
import MouthNeutral from '../mouths/Neutral.svg';
import MouthM from '../mouths/M.svg';
import MouthF from '../mouths/F.svg';
import MouthL from '../mouths/L.svg';
import MouthD from '../mouths/D.svg';
import MouthS from '../mouths/S.svg';
import MouthR from '../mouths/R.svg';
import MouthAh from '../mouths/Ah.svg';
import MouthEe from '../mouths/Ee.svg';
import MouthOh from '../mouths/Oh.svg';
import MouthUh from '../mouths/Uh.svg';
import MouthWOo from '../mouths/WO-o.svg';
import MouthSmile from '../mouths/Smile.svg';
import MouthSurprised from '../mouths/Surprised.svg';

/**
 * Maps AdobeViseme directly to its corresponding mouth sprite
 */
function getMouthSprite(viseme: AdobeViseme): string {
    switch (viseme) {
        case 'Neutral':
            return MouthNeutral;
        case 'M':
            return MouthM;
        case 'F':
            return MouthF;
        case 'L':
            return MouthL;
        case 'D':
            return MouthD;
        case 'S':
            return MouthS;
        case 'R':
            return MouthR;
        case 'Ah':
            return MouthAh;
        case 'Ee':
            return MouthEe;
        case 'Oh':
            return MouthOh;
        case 'Uh':
            return MouthUh;
        case 'WO-o':
            return MouthWOo;
        case 'Smile':
            return MouthSmile;
        case 'Surprised':
            return MouthSurprised;
        default:
            return MouthNeutral;
    }
}

type MouthSpriteProps = {
    viseme: AdobeViseme;
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
