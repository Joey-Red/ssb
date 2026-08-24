const codeOverrides: Readonly<Record<string, string>> = {
  'incineroar': 'gaogaen',
  'isabelle': 'shizue',
  'piranha-plant': 'packun_flower',
  'hero': 'dq_hero',
  'pyra': 'homura',
  'mythra': 'hikari',
  'min-min': 'minmin',
  'mii-brawler': 'mii_fighter',
  'mii-swordfighter': 'mii_fighter',
  'mii-gunner': 'mii_fighter',
  'squirtle': 'pokemon_trainer',
  'ivysaur': 'pokemon_trainer',
  'charizard': 'pokemon_trainer',
}

export function officialFighterCode(fighterId: string): string {
  return codeOverrides[fighterId] ?? fighterId.replaceAll('-', '_')
}

export function officialFighterRenderUrl(fighterId: string): string {
  const code = officialFighterCode(fighterId)
  return `https://www.smashbros.com/assets_v2/img/fighter/${code}/main.png`
}

export function officialFighterThumbUrl(fighterId: string): string {
  const code = officialFighterCode(fighterId)
  return `https://www.smashbros.com/assets_v2/img/fighter/thumb_v/${code}.png`
}
