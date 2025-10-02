import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Bookmark, Link2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { useAuth } from '@/contexts/useAuth'
import { cn } from '@/lib/utils'

interface QuickNote {
  id: string
  text: string
  createdAt: string
}

interface ShortcutLink {
  id: string
  label: string
  href: string
}

const STORAGE_VERSION = 1

export function NotesShortcutsWidget({ isInEditMode }: DashboardWidgetComponentProps) {
  const { user } = useAuth()
  const storageKey = useMemo(() => `dashboard.notes.${user?.id ?? 'anon'}.v${STORAGE_VERSION}`, [user?.id])
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [links, setLinks] = useState<ShortcutLink[]>([])
  const [noteDraft, setNoteDraft] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [linkHref, setLinkHref] = useState('')

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { notes?: QuickNote[]; links?: ShortcutLink[] }
      setNotes(parsed.notes ?? [])
      setLinks(parsed.links ?? [])
    } catch (error) {
      console.warn('Failed to read dashboard notes', error)
    }
  }, [storageKey])

  const persist = (nextNotes: QuickNote[], nextLinks: ShortcutLink[]) => {
    setNotes(nextNotes)
    setLinks(nextLinks)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ notes: nextNotes, links: nextLinks }))
    } catch (error) {
      console.warn('Failed to persist dashboard notes', error)
    }
  }

  const handleAddNote = (event: FormEvent) => {
    event.preventDefault()
    if (!noteDraft.trim()) return
    const nextNotes = [
      {
        id: crypto.randomUUID(),
        text: noteDraft.trim(),
        createdAt: new Date().toISOString(),
      },
      ...notes,
    ].slice(0, 5)
    persist(nextNotes, links)
    setNoteDraft('')
  }

  const handleAddLink = (event: FormEvent) => {
    event.preventDefault()
    if (!linkLabel.trim() || !linkHref.trim()) return
    const normalizedHref = linkHref.startsWith('http') ? linkHref.trim() : `https://${linkHref.trim()}`
    const nextLinks = [
      ...links,
      {
        id: crypto.randomUUID(),
        label: linkLabel.trim(),
        href: normalizedHref,
      },
    ].slice(-5)
    persist(notes, nextLinks)
    setLinkLabel('')
    setLinkHref('')
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <form onSubmit={handleAddNote} className="space-y-3">
        <label className="block text-sm font-medium text-muted-foreground" htmlFor="dashboard-note">
          Quick note
        </label>
        <Textarea
          id="dashboard-note"
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          placeholder="Jot down a reminder for the team"
          className="resize-none"
          disabled={isInEditMode}
          rows={3}
        />
        <Button type="submit" size="lg" className="inline-flex items-center gap-2" disabled={isInEditMode || !noteDraft.trim()}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add note
        </Button>
      </form>

      <form onSubmit={handleAddLink} className="grid gap-3">
        <label className="block text-sm font-medium text-muted-foreground" htmlFor="dashboard-shortcut-label">
          Pin a shortcut
        </label>
        <div className="grid gap-3 sm:grid-cols-2 sm:items-center sm:gap-4">
          <Input
            id="dashboard-shortcut-label"
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            placeholder="Label"
            disabled={isInEditMode}
            required
          />
          <Input
            value={linkHref}
            onChange={(event) => setLinkHref(event.target.value)}
            placeholder="https://example.com"
            disabled={isInEditMode}
            required
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="inline-flex items-center gap-2"
          disabled={isInEditMode || !linkLabel.trim() || !linkHref.trim()}
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          Save shortcut
        </Button>
      </form>

      <div className="grid gap-4">
        {notes.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bookmark className="h-4 w-4" aria-hidden="true" /> Notes
            </div>
            <ul className="space-y-2 text-sm">
              {notes.map((note) => (
                <li key={note.id} className="rounded-2xl bg-muted/50 px-4 py-3">
                  <p className="text-muted-foreground">{note.text}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {links.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Shortcuts</p>
            <ul className="flex flex-wrap gap-2 text-sm">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border border-dashed border-muted-foreground/40 px-4 py-2 text-sm text-foreground transition hover:border-muted-foreground hover:text-primary',
                      isInEditMode && 'pointer-events-none opacity-60'
                    )}
                  >
                    <Link2 className="h-4 w-4" aria-hidden="true" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
