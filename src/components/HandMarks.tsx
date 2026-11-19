import type { NoteStatus } from '../lib/types'

/** Cases et étoile « dessinées à la main » pour les pages du carnet (tracés légèrement irréguliers). */
const CIRCLE = 'M12.4 3.2 C6.9 2.6 3.1 6.6 3.3 11.9 C3.5 17.6 8 20.9 13.1 20.4 C18.4 19.9 21.2 15.4 20.5 10.2 C19.9 6 16.4 3.4 11.6 3.6'

export function HandCheck({ status, size = 24 }: { status: NoteStatus; size?: number }) {
  return (
    <svg className={`hand-mark state-${status}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={CIRCLE} />
      {status === 'draft' && <path d="M7.2 9.4 L15.6 6.2 M6.4 13.2 L17.4 9 M7.4 17 L18.2 12.8" strokeWidth="1.4" />}
      {status === 'deep' && <path d="M6.2 12.4 L10.8 17.2 L22.2 3.6" strokeWidth="2.6" />}
    </svg>
  )
}

export function HandStar({ size = 20 }: { size?: number }) {
  return (
    <svg className="hand-mark" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12.3 2.6 L14.8 9 L21.6 9.4 L16.3 13.7 L18.2 20.4 L12.1 16.7 L6.1 20.6 L7.9 13.8 L2.6 9.6 L9.5 9.1 Z" />
    </svg>
  )
}
