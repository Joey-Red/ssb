import { buildHistoricalIndexedSet, type HistoricalIndexedSetSeed } from './proLabHistoricalVodIndex'

type CompactRow = readonly [id: string, opponentTag: string, sourceDateAnchor: string, sourceLabel: string]

const seedsC: HistoricalIndexedSetSeed[] = []

const addGroup = (playerId: string, playerTag: string, playerFighterIds: readonly string[], rows: readonly CompactRow[]) => {
  for (const [id, opponentTag, sourceDateAnchor, sourceLabel] of rows) {
    seedsC.push({ id, playerId, playerTag, playerFighterIds, opponentTag, sourceDateAnchor, sourceLabel })
  }
}

addGroup('shinymark', 'ShinyMark', ['pikachu'], [
  ['hist6-201', 'MuteAce', '2024-07-01', 'Final Smash Fiesta Coinbox'],
  ['hist6-202', 'Sparg0', '2024-06-30', 'Online Tournament'],
  ['hist6-203', 'Sparg0', '2024-06-20', 'Coinbox'],
  ['hist6-204', 'Riddles', '2024-06-03', 'Coinbox 102'],
  ['hist6-205', 'MkLeo', '2024-06-01', 'Coinbox 102'],
  ['hist6-206', 'Buandon', '2024-05-25', 'Comicpalooza 2024 Pools Winners Quarters'],
  ['hist6-208', 'NEO', '2024-04-28', 'Diamond Dust Pre Local'],
  ['hist6-215', 'Sonix', '2024-02-29', 'Coinbox 89 Winners Semis'],
  ['hist6-276', 'Sonix', '2023-04-13', 'Coinbox 55 Grand Finals'],
  ['hist6-277', 'Jahzz0', '2023-04-13', 'Coinbox 55 Winners Semis'],
  ['hist6-287', 'MkLeo', '2023-03-18', 'Collision 2023 Losers Round 2'],
  ['hist6-289', 'Maister', '2023-03-12', 'Collision 2023 Top 8'],
  ['hist6-294', 'Wolfen', '2022-11-27', 'CUMBRE'],
  ['hist6-295', 'SpartanCR', '2022-11-27', 'CUMBRE'],
  ['hist6-296', 'BigBoss', '2022-11-27', 'CUMBRE Winners Finals'],
  ['hist6-297', 'Sparg0', '2022-11-16', 'Coinbox'],
])

addGroup('glutonny', 'Glutonny', ['wario'], [
  ['hist6-207', 'Suinoko', '2024-05-01', 'Sumapa 135'],
  ['hist6-209', 'Sam', '2024-04-28', 'Battle of BC 6'],
  ['hist6-210', 'Ludo', '2024-04-28', 'Battle of BC 6'],
  ['hist6-211', 'Armadillo', '2024-04-28', 'Battle of BC 6'],
  ['hist6-219', 'SHADIC', '2024-02-18', 'GENESIS X'],
  ['hist6-220', 'Kaeru', '2024-02-11', 'UltCore Second'],
])

addGroup('peabnut', 'Peabnut', ['mega-man'], [
  ['hist6-212', 'Zomba', '2024-03-14', 'Cirque 3 Losers Quarters'],
  ['hist6-213', 'Goblin', '2024-03-14', 'Cirque 3 Top 32'],
  ['hist6-214', 'Zomba', '2024-03-10', 'Litvitational 2'],
  ['hist6-221', 'omega', '2024-02-05', 'CODENAME Smash Next Door 2024 Losers Finals'],
  ['hist6-222', 'Senn', '2024-02-05', 'CODENAME Smash Next Door 2024 Losers Semis'],
  ['hist6-223', 'NoTag', '2024-02-05', 'CODENAME Smash Next Door 2024 Winners Semis'],
  ['hist6-224', 'Justice', '2024-02-05', 'CODENAME Smash Next Door 2024 Losers Quarters'],
  ['hist6-228', 'ApolloKage', '2024-02-03', 'DreamHack Atlanta 2023 Winners Semis'],
  ['hist6-229', 'Lil Dyl', '2024-01-20', 'The Oak City Premier Pools Quarterfinal'],
  ['hist6-230', 'Ashton', '2024-01-20', 'The Oak City Premier Winners Finals'],
])

addGroup('sonix', 'Sonix', ['sonic'], [
  ['hist6-216', 'Zackray', '2024-02-19', 'GENESIS X Top 32'],
  ['hist6-217', 'Sparg0', '2024-02-19', 'Coinbox 88 Winners Finals'],
  ['hist6-218', 'Sparg0', '2024-02-19', 'Coinbox 88 Grand Finals'],
  ['hist6-225', 'Wrath', '2024-02-03', 'Coinbox 87 Grand Finals'],
  ['hist6-226', 'Riddles', '2024-02-03', 'Coinbox 87 Losers Finals'],
  ['hist6-227', 'Maister', '2024-02-03', 'Coinbox 87 Losers Semis'],
  ['hist6-231', 'Tweek', '2024-01-08', 'LMBM 2024 Winners Finals'],
  ['hist6-232', 'Tweek', '2024-01-08', 'LMBM 2024 Grand Finals'],
  ['hist6-233', 'Sparg0', '2024-01-08', 'LMBM 2024 Losers Finals'],
  ['hist6-234', 'Skyjay', '2024-01-08', 'LMBM 2024 Top 8'],
  ['hist6-235', 'Dominator', '2024-01-08', 'LMBM 2024'],
  ['hist6-236', 'Sparg0', '2023-12-19', 'Coinbox IRL Winners Finals'],
  ['hist6-237', 'Sisqui', '2023-12-19', 'Coinbox IRL Winners Semis'],
  ['hist6-238', 'Sparg0', '2023-12-17', 'Coinbox 86 Grand Finals'],
  ['hist6-239', 'Sparg0', '2023-12-16', 'Coinbox 86 Winners Finals'],
  ['hist6-240', 'acola', '2023-12-11', 'Watch The Throne 2023 Losers Semis'],
  ['hist6-241', 'Sparg0', '2023-12-11', 'Watch The Throne 2023 Top 8'],
  ['hist6-242', 'Sparg0', '2023-12-11', 'Watch The Throne 2023 Grand Finals'],
])

addGroup('apollokage', 'ApolloKage', ['snake'], [
  ['hist6-243', 'Cynical', '2023-10-30', 'SLU #94 Winners Finals'],
  ['hist6-244', 'Cynical', '2023-10-30', 'SLU #94 Grand Finals'],
  ['hist6-245', 'Neo', '2023-10-29', 'LMM Miami 2023'],
  ['hist6-246', 'MuteAce', '2023-10-29', 'LMM Miami 2023'],
  ['hist6-247', 'Kobe', '2023-10-29', 'LMBM Miami 2023'],
  ['hist6-248', 'Yoshi Kid', '2023-10-17', 'Maryville After Dark Grand Finals'],
  ['hist6-249', 'Sarcasm', '2023-10-17', 'Maryville After Dark Winners Quarters'],
  ['hist6-250', 'Morly!', '2023-10-17', 'Maryville After Dark Winners Finals'],
  ['hist6-251', 'JStep', '2023-10-17', 'Maryville After Dark Winners Semis'],
  ['hist6-257', 'BeastModePaul', '2023-10-07', 'ReWired Fest 2023'],
  ['hist6-269', 'TigerBoi', '2023-04-18', 'Smash @ Mizzou Winners Semis'],
  ['hist6-270', 'Rocke', '2023-04-18', 'Smash @ Mizzou Grand Finals'],
  ['hist6-271', 'Aethyr', '2023-04-18', 'Smash @ Mizzou Winners Round 3'],
  ['hist6-272', 'Wisdom', '2023-04-16', 'LGS4 Winners Semis'],
  ['hist6-273', 'Wisdom', '2023-04-16', 'LGS4 Losers Finals'],
  ['hist6-274', 'Justin23', '2023-04-16', 'LGS4 Winners Finals'],
  ['hist6-275', 'Justin23', '2023-04-16', 'LGS4 Grand Finals'],
])

addGroup('light', 'Light', ['fox'], [
  ['hist6-252', 'Sparg0', '2023-10-08', 'ReWired Fest 2023 Losers Semis'],
  ['hist6-253', 'MuteAce', '2023-10-08', 'ReWired Fest 2023 Top 8'],
  ['hist6-254', 'Glutonny', '2023-10-08', 'ReWired Fest 2023 Grand Finals'],
  ['hist6-255', 'Deathspade', '2023-10-08', 'ReWired Fest 2023 Top 8'],
  ['hist6-256', 'BeastModePaul', '2023-10-07', 'ReWired Fest 2023'],
])

addGroup('ken-sonic', 'KEN', ['sonic'], [
  ['hist6-258', 'Toriguri', '2023-05-25', 'Japanese indexed competitive set'],
  ['hist6-259', 'Kisha', '2023-05-25', 'Japanese indexed competitive set'],
  ['hist6-260', 'Kamisuke', '2023-05-25', 'Japanese indexed competitive set'],
  ['hist6-261', 'Umeki', '2023-05-16', 'KAGARIBI #10'],
  ['hist6-262', 'Sparg0', '2023-05-12', 'KAGARIBI #10'],
])

addGroup('sisqui', 'Sisqui', ['samus', 'dark-samus'], [
  ['hist6-263', 'crêpe salée', '2023-05-09', 'WANTED May Grand Finals'],
  ['hist6-264', 'TriM', '2023-05-09', 'WANTED May Top 8'],
  ['hist6-265', 'Alw', '2023-05-09', 'WANTED May'],
  ['hist6-266', 'Raflow', '2023-05-02', 'IB Games #1 / EU Coinbox'],
  ['hist6-267', 'Glutonny', '2023-04-24', 'Invasion April 2023 Winners Semis'],
  ['hist6-268', 'AndresFN', '2023-04-24', 'Invasion April 2023 Losers Quarters'],
  ['hist6-278', 'TriM', '2023-04-04', 'Glory 3 Top 32'],
  ['hist6-279', 'Raflow', '2023-04-04', 'Glory 3 Losers Finals'],
  ['hist6-280', 'Flow', '2023-04-04', 'Glory 3 Winners Quarters'],
  ['hist6-281', 'Bloom4Eva', '2023-04-04', 'Glory 3 Grand Finals'],
])

addGroup('muteace', 'MuteAce', ['peach'], [
  ['hist6-282', 'z3', '2023-03-24', 'Texas Reverie 2023 Winners Quarters'],
  ['hist6-283', 'Skeleton', '2023-03-24', 'Texas Reverie 2023 Winners Semis'],
  ['hist6-284', 'Lima', '2023-03-24', 'Texas Reverie 2023 Winners Finals'],
  ['hist6-285', 'Lima', '2023-03-24', 'Texas Reverie 2023 Grand Finals'],
  ['hist6-286', 'Shiny', '2023-03-21', 'Texas Reverie 2023 Pools'],
  ['hist6-288', 'Waltz', '2023-03-18', 'Texas Reverie 2023 Pools'],
])

addGroup('karaage', 'Karaage', ['captain-falcon'], [
  ['hist6-290', 'Neo', '2023-03-05', "Maesuma'TOP #11"],
  ['hist6-291', 'KEN', '2023-03-05', "Maesuma'TOP #11 Top 8"],
  ['hist6-292', 'Daikon', '2023-03-05', "Maesuma'TOP #11"],
  ['hist6-293', 'Asimo', '2023-03-05', "Maesuma'TOP #11 Top 8"],
])

addGroup('tea', 'Tea', ['kazuya', 'pac-man'], [
  ['hist6-298', 'てで', '2021-12-30', 'KAGARIBI #5'],
  ['hist6-299', 'Sigma', '2021-12-30', 'KAGARIBI #5'],
  ['hist6-300', 'Light', '2021-12-30', 'KAGARIBI #5 Top 12'],
])

export const proVodCatalogHistoricalBatch6C = seedsC.map(buildHistoricalIndexedSet)
