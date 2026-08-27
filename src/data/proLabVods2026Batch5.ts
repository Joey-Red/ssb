import { buildIndexedTournamentVod, buildResolvedTournamentVod } from './proLabVodIndex'
import type { ProVodEventTier, ProVodRecord } from './proLabTypes'

interface EventSeed {
  event: string
  eventTier: ProVodEventTier
  eventDate: string
  tournamentSourceUrl: string
  strongOpposition: boolean
}

type IndexedRow = readonly [id: string, playerId: string, playerTag: string, playerFighters: readonly string[], opponentTag: string, opponentFighters: readonly string[], round: string]
type DirectRow = readonly [...IndexedRow, youtubeId: string]

const indexed = (common: EventSeed, rows: readonly IndexedRow[]): readonly ProVodRecord[] =>
  rows.map(([id, playerId, playerTag, playerFighterIds, opponentTag, opponentFighterIds, round]) =>
    buildIndexedTournamentVod({
      ...common,
      id,
      title: `${common.event} — ${playerTag} vs. ${opponentTag}`,
      playerId,
      playerFighterIds,
      opponentTag,
      opponentFighterIds,
      round,
      searchPlayerTag: playerTag,
      searchOpponentTag: opponentTag,
    }),
  )

const direct = (common: EventSeed, rows: readonly DirectRow[]): readonly ProVodRecord[] =>
  rows.map(([id, playerId, playerTag, playerFighterIds, opponentTag, opponentFighterIds, round, youtubeId]) =>
    buildResolvedTournamentVod({
      ...common,
      id,
      title: `${common.event} — ${playerTag} vs. ${opponentTag}`,
      playerId,
      playerFighterIds,
      opponentTag,
      opponentFighterIds,
      round,
      searchPlayerTag: playerTag,
      searchOpponentTag: opponentTag,
      youtubeId,
    }),
  )

const worst: EventSeed = { event: 'The Worst #20', eventTier: 'regional', eventDate: '2026-08-23', tournamentSourceUrl: 'https://www.start.gg/tournament/the-worst-20/events', strongOpposition: true }
const sumapa: EventSeed = { event: 'Weekly Smash Party #242', eventTier: 'weekly', eventDate: '2026-08-19', tournamentSourceUrl: 'https://www.start.gg/tournament/weekly-smash-party-242/event/special-1on1-ultimate-singles', strongOpposition: true }
const bobc: EventSeed = { event: 'Battle of BC 8', eventTier: 'regional', eventDate: '2026-06-07', tournamentSourceUrl: 'https://liquipedia.net/smash/Battle_of_BC/8/Ultimate', strongOpposition: true }
const flash: EventSeed = { event: 'Flash Flood', eventTier: 'major', eventDate: '2026-02-28', tournamentSourceUrl: 'https://www.ssbwiki.com/Tournament:Flash_Flood', strongOpposition: true }
const delta: EventSeed = { event: 'DELTA x Seibugeki Open', eventTier: 'supermajor', eventDate: '2026-04-19', tournamentSourceUrl: 'https://www.ssbwiki.com/Tournament:DELTA_x_Seibugeki_Open', strongOpposition: true }
const goml: EventSeed = { event: 'Get On My Level 2026', eventTier: 'supermajor', eventDate: '2026-08-02', tournamentSourceUrl: 'https://www.ssbwiki.com/Tournament:Get_On_My_Level_2026', strongOpposition: true }
const patch: EventSeed = { event: 'Patchwork 2026: A Love Letter', eventTier: 'regional', eventDate: '2026-06-21', tournamentSourceUrl: 'https://liquipedia.net/smash/Patchwork/2026', strongOpposition: true }

const worstIndexed = indexed(worst, [
  ['worst20-01','waka','WaKa',['luigi'],'Pol',['bowser-jr'],'Bracket round not yet verified'],
  ['worst20-02','alandiss','AlanDiss',['snake'],'Vigilante',['richter'],'Bracket round not yet verified'],
  ['worst20-03','sparg0','Sparg0',['young-link'],'Lazor',['diddy-kong'],'Bracket round not yet verified'],
  ['worst20-04','waka','WaKa',['luigi'],'Gros Michel',['pac-man'],'Bracket round not yet verified'],
  ['worst20-05','sparg0','Sparg0',['young-link'],'AlexDisc',['sonic'],'Bracket round not yet verified'],
  ['worst20-06','waka','WaKa',['luigi'],'AlanDiss',['snake'],'Top 8'],
  ['worst20-07','sparg0','Sparg0',['young-link'],'Andrik',['captain-falcon'],'Top 8'],
  ['worst20-08','alandiss','AlanDiss',['snake'],'AlexDisc',['sonic'],'Top 8'],
  ['worst20-09','sparg0','Sparg0',['young-link'],'WaKa',['mii-brawler'],'Winners Finals'],
  ['worst20-10','alandiss','AlanDiss',['snake'],'Andrik',['captain-falcon'],'Losers Semifinals'],
  ['worst20-11','waka','WaKa',['luigi'],'Andrik',['captain-falcon'],'Losers Finals'],
  ['worst20-12','sparg0','Sparg0',['young-link'],'Andrik',['captain-falcon'],'Grand Finals'],
])

const sumapaIndexed = indexed(sumapa, [
  ['sumapa242-01','ken-sonic','KEN',['sephiroth'],'tomisa',['ice-climbers'],'Bracket round not yet verified'],
  ['sumapa242-02','akakikusu','Akakikusu',['sora','palutena'],'tameigo',['rob'],'Bracket round not yet verified'],
  ['sumapa242-03','ken-sonic','KEN',['sonic'],'AyaLin',['sora'],'Bracket round not yet verified'],
  ['sumapa242-04','reno-jp','Reno',['greninja'],'Shion',['hero'],'Bracket round not yet verified'],
  ['sumapa242-05','reno-jp','Reno',['greninja'],'akasa',['cloud'],'Top 8'],
  ['sumapa242-06','reno-jp','Reno',['greninja'],'uame',['olimar'],'Top 8'],
  ['sumapa242-07','reno-jp','Reno',['greninja'],'Shuton',['olimar'],'Losers Semifinals'],
  ['sumapa242-08','reno-jp','Reno',['greninja'],'tameigo',['rob'],'Losers Finals'],
  ['sumapa242-09','reno-jp','Reno',['greninja','byleth'],'Miya',['wario'],'Grand Finals'],
])

const bobcIndexed = indexed(bobc, [
  ['bobc8-01','hurt','Hurt',['snake'],'MarK',['yoshi'],'Winners Semifinals'],
  ['bobc8-02','ouch','Ouch!?',['wolf'],'zawg',['duck-hunt'],'Winners Semifinals'],
  ['bobc8-03','hurt','Hurt',['snake'],'Ouch!?',['wolf'],'Winners Finals'],
  ['bobc8-04','zawg','zawg',['duck-hunt'],'Syrup',['steve'],'Losers Quarterfinals'],
  ['bobc8-05','syrup','Syrup',['steve'],'Monte',['mr-game-and-watch'],'Losers Semifinals'],
  ['bobc8-06','syrup','Syrup',['steve'],'Ouch!?',['wolf'],'Losers Finals'],
  ['bobc8-07','hurt','Hurt',['snake'],'Syrup',['ness','steve'],'Grand Finals'],
  ['bobc8-08','syrup','Syrup',['steve'],'Char',['steve'],'Losers Eighths'],
  ['bobc8-09','hurt','Hurt',['snake'],'Moongly',['king-k-rool'],'Top 64'],
  ['bobc8-10','hurt','Hurt',['snake'],'Titanium',['rob'],'Pools'],
  ['bobc8-11','syrup','Syrup',['ness'],'Snow',['mario'],'Top 24'],
  ['bobc8-12','syrup','Syrup',['ness'],'Gamer',['donkey-kong'],'Pools'],
  ['bobc8-13','zawg','zawg',['duck-hunt'],'Fatality',['captain-falcon'],'Top 64'],
  ['bobc8-14','snow-jp','Snow',['mario','pyra'],'zawg',['duck-hunt'],'Top 64'],
  ['bobc8-15','apollokage','ApolloKage',['snake'],'Shoghi',['ike'],'Pools'],
  ['bobc8-16','ouch','Ouch!?',['wolf'],'JDV',['pac-man'],'Top 64'],
])

const flashIndexed = indexed(flash, [
  ['flash26-01','miya','Miya',['mr-game-and-watch'],'Poppin',['little-mac'],'Winners Top 64'],
  ['flash26-03','miya','Miya',['mr-game-and-watch'],'Toon',['steve'],'Winners Finals'],
  ['flash26-04','miya','Miya',['mr-game-and-watch'],'Syrup',['steve'],'Winners Semifinals'],
  ['flash26-05','syrup','Syrup',['steve'],'Lui$',['palutena'],'Winners Quarterfinals'],
  ['flash26-06','syrup','Syrup',['steve'],'Brandino',['squirtle','ivysaur','charizard'],'Pools'],
  ['flash26-07','syrup','Syrup',['steve'],'Asimo',['ryu'],'Losers Semifinals'],
  ['flash26-08','jakal','Jakal',['wolf'],'Lui$',['palutena'],'Winners Top 32'],
  ['flash26-09','luis','Lui$',['palutena'],'Blueberry Aficionado',['mii-brawler'],'Winners Top 64'],
])

const flashDirect = direct(flash, [
  ['flash26-02','miya','Miya',['mr-game-and-watch'],'Asimo',['ryu'],'Grand Finals','FTsD_49bBWI'],
])

const deltaIndexed = indexed(delta, [
  ['delta-seibu-01','miya','Miya',['mr-game-and-watch'],'Yaura',['samus'],'Bracket round not yet verified'],
  ['delta-seibu-02','miya','Miya',['mr-game-and-watch'],'Leaf',['robin'],'Bracket round not yet verified'],
  ['delta-seibu-03','raru','Raru',['luigi'],'Miya',['mr-game-and-watch'],'Top 8'],
  ['delta-seibu-04','shuton','Shuton',['olimar'],'Miya',['wolf','mr-game-and-watch'],'Losers Semifinals'],
  ['delta-seibu-05','reno-jp','Reno',['sephiroth'],'Miya',['mr-game-and-watch'],'Top 48'],
  ['delta-seibu-06','raru','Raru',['luigi'],'LemozonA',['snake','young-link'],'Top 48'],
])

const gomlDirect = direct(goml, [
  ['goml26-01','hurt','Hurt',['snake'],'Petayaa',['kazuya'],'Bracket round not yet verified','Ws03O3ZXS6E'],
  ['goml26-02','hurt','Hurt',['snake'],'Lima',['bayonetta'],'Winners Finals','vYwDh5rsaqk'],
  ['goml26-03','hurt','Hurt',['snake'],'MkLeo',['joker'],'Grand Finals','H38Wi0AF9To'],
  ['goml26-04','hurt','Hurt',['snake'],'zawg',['duck-hunt'],'Bracket round not yet verified','Euh0MsonMX8'],
  ['goml26-05','hurt','Hurt',['snake'],'BeastModePaul',['hero'],'Bracket round not yet verified','Cpy2BKLG4CE'],
  ['goml26-06','hurt','Hurt',['snake'],'Light',['fox'],'Top 8','iwrYp495FRM'],
])

const patchDirect = direct(patch, [
  ['patchwork26-extra-01','kola','Kola',['pyra','mythra'],'Fantasia',['samus'],'Winners Round 4','ABiAJiu6olI'],
  ['patchwork26-extra-02','jahzz0','Jahzz0',['ken'],'PkChris',['ness'],'Top 96 Winners','7NgloAD-NN8'],
  ['patchwork26-extra-03','lima','Lima',['bayonetta'],'Alternis',['terry'],'Top 24 Qualifier (Winners)','ntJHDtsGjTY'],
])

export const proVodCatalog2026Batch5: readonly ProVodRecord[] = [...worstIndexed, ...sumapaIndexed, ...bobcIndexed, ...flashIndexed, ...flashDirect, ...deltaIndexed, ...gomlDirect, ...patchDirect]
