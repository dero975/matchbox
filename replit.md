# Matchbox - App di Scambio Figurine

## Panoramica del Progetto
Matchbox è un'app mobile per lo scambio di figurine (Panini, Pokémon, etc.) ottimizzata per smartphone con approccio privacy-first. Solo nickname e password richiesti, nessun dato personale.

## Caratteristiche Principali
- **Privacy-focused**: Solo nickname + password, nessun email/telefono
- **Mobile-first**: Design ottimizzato esclusivamente per smartphone
- **Sessioni persistenti**: Login mantenuto per 30 giorni
- **Album completi**: "Calciatori Panini 2024/25" con 700 figurine
- **Matching automatico**: Sistema 1:1 per scambi equi
- **Interfaccia italiana**: Completamente localizzata

## Architettura Tecnica
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL + Drizzle ORM
- **Sessioni**: express-session con cookie httpOnly
- **Styling**: Tailwind CSS + shadcn/ui
- **PWA**: Service Worker configurato

## Modifiche Recenti (2025-01-10)
- ✅ **Login persistente implementato**: Sessioni mantengono 30 giorni
- ✅ **Risolti errori React Hooks**: Sistema auth semplificato
- ✅ **Homepage pulita**: Rimossi 3 album box, container bianco minimale
- ✅ **Sessioni corrette**: req.session.save() per persistenza immediata
- ✅ **Routing condizionale**: Loading spinner e gestione auth migliorata

## Preferenze Utente
- **Linguaggio**: Italiano per interfaccia e contenuti
- **Design**: Teal/giallo/bianco, mobile-first
- **Funzionalità**: Mantenere login, interfaccia pulita e minimale
- **Database**: PostgreSQL per persistenza, no mock data

## Note Tecniche
- Cookie di sessione: `maxAge: 30 giorni`, `httpOnly: true`, `sameSite: 'lax'`
- Backup localStorage per dati utente non critici
- Validazione Zod per tutti i form
- Query React Query per cache efficiente

## Stato Attuale
✅ Sistema di autenticazione funzionante
✅ Homepage semplificata e pulita
✅ Login persistente attivo
✅ Database popolato con figurine campione
⚠️ Da implementare: Gestione completa album e match