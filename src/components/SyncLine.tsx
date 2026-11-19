import { Check, CircleAlert } from 'lucide-react'
import type { SyncStatus } from '../lib/sync'

/** État d'enregistrement : Enregistré, Enregistrement…, ou Hors ligne (le texte est gardé sur l'appareil). */
export default function SyncLine({ sync }: { sync: SyncStatus }) {
  if (sync === 'saved') return <p className="sync ok" role="status"><Check size={16} aria-hidden="true" />Enregistré</p>
  if (sync === 'pending') return <p className="sync" role="status">Enregistrement…</p>
  return <p className="sync warn" role="status"><CircleAlert size={16} aria-hidden="true" />Hors ligne : ton texte est gardé sur cet appareil et sera renvoyé</p>
}
