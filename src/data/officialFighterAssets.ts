function publicAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

/** Local, vendored fighter render served from the same Pages origin. */
export function officialFighterRenderUrl(fighterId: string): string {
  return publicAsset(`media/fighters/renders/${fighterId}.webp`)
}

/** Local, vendored roster thumbnail served from the same Pages origin. */
export function officialFighterThumbUrl(fighterId: string): string {
  return publicAsset(`media/fighters/thumbs/${fighterId}.webp`)
}
