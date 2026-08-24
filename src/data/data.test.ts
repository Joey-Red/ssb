import { describe, expect, it } from 'vitest'
import { validateGuides, validateRoster } from '../lib/validation'
import { guides } from './guides'
import { roster } from './roster'
import { sources } from './sources'

describe('static SSBU data',()=>{
  it('has a complete unique fighter manifest',()=>expect(validateRoster(roster)).toEqual([]))
  it('has valid source-aware reference guides',()=>expect(validateGuides(guides,roster,sources)).toEqual([]))
  it('starts with four fully populated reference fighters',()=>expect(guides.map((guide)=>guide.fighterId).sort()).toEqual(['mario','mythra','pyra','squirtle']))
})
