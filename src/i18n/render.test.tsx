import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, describe, expect, it } from 'vitest'
import Compare from '../components/Compare'
import Fiche from '../components/Fiche'
import FiltersPanel from '../components/FiltersPanel'
import HistoryList from '../components/HistoryList'
import NoteView from '../components/NoteView'
import NotesList from '../components/NotesList'
import PhilosophyCard from '../components/PhilosophyCard'
import PhilosophyList from '../components/PhilosophyList'
import Progress from '../components/Progress'
import { DataProvider } from '../lib/DataContext'
import { emptyFilters } from '../lib/draw'
import { allTopics, families, philosophies, themes } from '../lib/seed'
import { emptyNote, type Note, type NoteStatus } from '../lib/types'
import { LangProvider } from './index'
import { localizeFamily, localizePhilosophy, localizeTheme, localizeTopic } from './content'
import { storeLang, type Lang } from './core'

/** Fabrique un écran dans une langue, avec les vraies données du seed traduites comme dans l'application. */
function inLang<T>(lang: Lang, render: (d: { P: typeof philosophies; T: typeof allTopics }) => ReactElement): string {
  storeLang(lang)
  const P = philosophies.map((p) => localizePhilosophy(p, lang))
  const T = allTopics.map((t) => localizeTopic(t, lang))
  const F = families.map((f) => localizeFamily(f, lang))
  const H = themes.map((t) => localizeTheme(t, lang))
  return renderToStaticMarkup(
    <LangProvider>
      <DataProvider families={F} themes={H}>{render({ P, T })}</DataProvider>
    </LangProvider>,
  )
}

// Mots français de l'interface qui ne doivent jamais apparaître en anglais.
const FRENCH = /\b(Tirer|Carnet|Philosophies? tirée|Sujets?|Brouillon|Approfondi|Famille|Réinitialiser|Enregistr\w+|Fiches?|Époque|Région|Rechercher|Effacer|Aucune?|Écrire|Aperçu|Ouvrir|Retour|Étiquettes?|Recherche|Réaction|Favoris|Ajouter|Supprimer|Modifier)\b/

const none = { sync: 'saved' as const }
const notes: Record<string, Note> = {}
const statuses: Record<string, NoteStatus> = {}

afterAll(() => storeLang('fr'))

describe('écrans principaux : anglais sans reste de français', () => {
  const screens: [string, (d: { P: typeof philosophies; T: typeof allTopics }) => ReactElement][] = [
    ['progression', ({ P, T }) => <Progress philosophies={P} topics={T} statuses={statuses} />],
    ['filtres', () => <FiltersPanel filters={emptyFilters} settings={{ noRepeat: true, onlyRemaining: false, discovery: false, sound: true }} onFilters={() => {}} onSettings={() => {}} onResetHistory={() => {}} wheelCount={87} historyCount={3} />],
    ['carte de résultat', ({ P }) => <PhilosophyCard philosophy={P[7]} number={8} total={87} progress={{ deep: 2, total: 17 }} onPatch={() => {}} onTopicWheel={() => {}} onClose={() => {}} />],
    ['liste du carnet', ({ P, T }) => <PhilosophyList philosophies={P} topics={T} notes={notes} statuses={statuses} query="" onQuery={() => {}} />],
    ['liste vide de notes', ({ P, T }) => <NotesList notes={{}} philosophies={P} topics={T} />],
    ['historique vide', ({ P, T }) => <HistoryList history={[]} philosophies={P} topics={T} />],
    ['fiche', ({ P, T }) => <Fiche philosophy={P[7]} number={8} total={87} topics={T} statuses={statuses} syntheses={{}} sync={none.sync} schemaReady onPatch={() => {}} onWrite={() => {}} onSynthesis={() => {}} />],
    ['note', ({ P, T }) => <NoteView philosophy={P[7]} topic={T[1]} note={{ ...emptyNote(P[7].id, T[1].id), sources: [{ title: 'Meditations', url: 'https://example.org', type: 'livre' }] }} sync={none.sync} onChange={() => {}} onBack={() => {}} />],
    ['note (sujet propre)', ({ P, T }) => <NoteView philosophy={P[7]} topic={T.find((t) => t.philosophy === P[7].id)!} note={emptyNote(P[7].id, 'x')} sync={none.sync} onChange={() => {}} onBack={() => {}} />],
    ['comparer', ({ P, T }) => <Compare philosophies={P} topics={T} notes={notes} syntheses={{}} params={new URLSearchParams()} onParams={() => {}} />],
  ]

  for (const [name, render] of screens) {
    it(name, () => {
      const en = inLang('en', render)
      expect(en.length).toBeGreaterThan(50)
      expect(en, `reste de français dans « ${name} »`).not.toMatch(FRENCH)
      const fr = inLang('fr', render)
      expect(fr).not.toBe(en)
    })
  }

  it('la fiche anglaise parle de Stoicism, pas de Stoïcisme', () => {
    const html = inLang('en', ({ P, T }) => <Fiche philosophy={P[7]} number={8} total={87} topics={T} statuses={statuses} syntheses={{}} sync="saved" schemaReady onPatch={() => {}} onWrite={() => {}} onSynthesis={() => {}} />)
    expect(html).toContain('Stoicism')
    expect(html).toContain('My writings on Stoicism')
    expect(html).toContain('Finitude and time')
    expect(html).toContain('Specific to Stoicism')
    expect(html).not.toContain('Stoïcisme')
  })

  it('en français, la fiche garde ses textes d’origine', () => {
    const html = inLang('fr', ({ P, T }) => <Fiche philosophy={P[7]} number={8} total={87} topics={T} statuses={statuses} syntheses={{}} sync="saved" schemaReady onPatch={() => {}} onWrite={() => {}} onSynthesis={() => {}} />)
    expect(html).toContain('Mes écrits sur le stoïcisme')
    expect(html).toContain('Propre au stoïcisme')
  })
})
