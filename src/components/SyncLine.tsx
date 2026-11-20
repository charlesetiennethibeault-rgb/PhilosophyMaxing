import { Check, CircleAlert } from 'lucide-react'
import { useLang } from '../i18n'
import type { SyncStatus } from '../lib/sync'

/** État d'enregistrement : Enregistré, Enregistrement…, ou Hors ligne (le texte est gardé sur l'appareil). */
export default function SyncLine({ sync }: { sync: SyncStatus }) {
  const { t } = useLang()
  if (sync === 'saved') return <p className="sync ok" role="status"><Check size={16} aria-hidden="true" />{t('save.saved')}</p>
  if (sync === 'pending') return <p className="sync" role="status">{t('save.saving')}</p>
  return <p className="sync warn" role="status"><CircleAlert size={16} aria-hidden="true" />{t('save.offline')}</p>
}
