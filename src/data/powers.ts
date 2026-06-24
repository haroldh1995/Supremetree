import type { LivingAnswerDefinition, PowerDefinition } from '../domain/types'

export const APP_VERSION = '1.0.1'
export const SAVE_SCHEMA_VERSION = 1
export const CANONICAL_DATA_VERSION = 'dumare-d20-superpower-tree-2026-06-24-r2'
export const CANONICAL_DATA_HASH =
  '4C9E47401A98BFED5A0D7354B7BEA97A51368016040D7BE6D9AD48D3C14CCD3C'
export const COMPATIBLE_CANONICAL_DATA_HASHES = [
  CANONICAL_DATA_HASH,
  '0379E4ADA4F3C15135F1017324C842136537B683AA0A909E09FF3F634A532FB7',
] as const

export const canonicalSourceNote =
  'Canonical text was transcribed from the updated uploaded Dumare_D20_Superpower_Tree.docx supplied on 2026-06-24.'

export const powers: PowerDefinition[] = [
  {
    id: 'petrifying-gaze',
    number: 1,
    name: 'Petrifying Gaze',
    tier: 1,
    category: 'Foundations of Power',
    shortDescription: 'Turn anything Dumare sees into stone.',
    fullDescription:
      "Dumare's eyes flash and encase anything he physically sees in stone. Holding the gaze adds more layers, and once the outer stone cannot expand outward, the pressure begins moving inward.",
    dmExample:
      'Dumare sees a charging demon and flashes his eyes, instantly coating its legs in stone long enough to stop the charge.',
    firstRollBacklash:
      "Uncontrolled Petrification: Dumare's eyes flash uncontrollably, and anything within his sightline may begin turning to stone, including enemies, allies, weapons, cover, terrain, and objects he never intended to target.",
    weaknesses:
      'Requires physical line of sight. Blindness, darkness, smoke, mirrors, invisibility, speed too fast to track, or enemies outside his field of vision can avoid it. Hexed or desecrated land can weaken or block the stone effect unless Gaia Reclamation is active.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'gaze',
    visualPosition: { x: 230, y: 1110 },
    connectionTargets: ['wingless-flight'],
  },
  {
    id: 'wingless-flight',
    number: 2,
    name: 'Wingless Flight',
    tier: 1,
    category: 'Foundations of Power',
    shortDescription: 'True flight without wings.',
    fullDescription:
      'Dumare develops true wingless flight through chaos-born gravity-pressure adaptation, letting him chase flyers, maneuver in open air, and fight across three-dimensional battlefields.',
    dmExample:
      'A flying enemy tries to stay above the fight, but Dumare launches upward and meets them in the air with a full-force tackle.',
    firstRollBacklash:
      'Gravitational Rejection: Gravity violently rejects Dumare in the wrong direction. He may launch upward, sideways, backward, or diagonally without control, dragging debris or nearby people into his pressure wake.',
    weaknesses:
      'Early flight may be rough, force-heavy, and hard to turn precisely. Gravity manipulation, spatial distortion, vacuum exposure before proper adaptation, anti-flight fields, or overwhelming aerial speed can counter it.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'flight',
    visualPosition: { x: 365, y: 1110 },
    connectionTargets: ['stormlight-current'],
  },
  {
    id: 'stormlight-current',
    number: 3,
    name: 'Stormlight Current',
    tier: 1,
    category: 'Foundations of Power',
    shortDescription: 'Lightning and light for ranged offense.',
    fullDescription:
      'Dumare releases lightning mixed with light. It works as ranged offense, anti-corruption pressure, anti-demon force, energy-system disruption, and conductor-based battlefield control through natural metal, wet ground, stone veins, roots, or water.',
    dmExample:
      "Dumare punches the ground and Stormlight races through a metal war machine's legs, overloading its joints and burning corruption out of the battlefield.",
    firstRollBacklash:
      "Conductive Overflow: Stormlight erupts through Dumare's nerves and automatically jumps into nearby conductors. Metal, water, machines, roots, blood, spell channels, allies, enemies, and terrain may all carry the uncontrolled discharge.",
    weaknesses:
      'Poor conductors, insulated armor, energy absorption, lightning immunity, light-devouring darkness, or enemies with no corruption/system weakness can reduce its impact. It can also risk collateral damage through conductive environments.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'stormlight',
    visualPosition: { x: 500, y: 1110 },
    connectionTargets: ['grand-denial'],
  },
  {
    id: 'grand-denial',
    number: 4,
    name: 'The Grand Denial',
    tier: 1,
    category: 'Foundations of Power',
    shortDescription: 'Foreign-source effects must fight to apply.',
    fullDescription:
      "Dumare's Disobedient Child evolves into a body-wide rejection of effects from all foreign sources. Magic, alchemy, curses, possession, banishment, forced transformation, soul hooks, teleport targeting, supernatural commands, reality impositions, divine influence, demonic effects, physical damage effects, and other foreign-source forces must fight Dumare before they can apply to him. During this contest, the effect does not immediately damage, alter, command, remove, rewrite, or define him. If Dumare wins the stat check, the effect fails to apply. If the foreign source overpowers The Grand Denial, the effect applies normally. This is not true negation; it is forced postponement and contest before application.",
    dmExample:
      "An alchemist launches a transmutation blade that cuts physically while also trying to rewrite Dumare's flesh into glass. Because the cut, damage, and alchemical change come from a foreign source, they do not immediately apply while The Grand Denial contests them. If Dumare stat-checks the effect, the cut and transmutation fail. If the alchemy overpowers him, the blade wounds him and the transformation begins.",
    firstRollBacklash:
      'Universal Rejection: Dumare rejects foreign influence too broadly. Enemy attacks are contested, but so are healing, buffs, rescue teleportation, protective magic, and other beneficial effects. Nearby imposed laws may also glitch as gravity, time, soul effects, and spell timing struggle against him.',
    weaknesses:
      "The Grand Denial can be overpowered by stronger force, superior magic, superior alchemy, divine authority, layered rituals, repeated pressure, overwhelming physical damage, or effects far above Dumare's current tier. It does not make him immune; it only forces foreign-source effects to defeat his denial before applying. Certain calamity weapons, absolute effects, or specialized anti-Dumare attacks may bypass the initial postponement and damage him immediately. Dumare's own inherent bloodline abilities, stabilized biological powers, self-generated consequences, and natural consequences that are not acting on him from a foreign source are not rejected.",
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'denial',
    visualPosition: { x: 635, y: 1110 },
    connectionTargets: ['anchor-pulse'],
  },
  {
    id: 'anchor-pulse',
    number: 5,
    name: 'Anchor Pulse',
    tier: 1,
    category: 'Foundations of Power',
    shortDescription: 'Resists teleportation and forced displacement.',
    fullDescription:
      'Dumare stabilizes space around himself, contesting teleportation, portals, banishment, blinking, forced swaps, dimensional pulls, and spatial removal.',
    dmExample:
      'A sorcerer opens a portal under Dumare, but he stomps and the space buckles, forcing the portal to flicker instead of swallowing him.',
    firstRollBacklash:
      'Total Lockdown: Dumare anchors both himself and the surrounding space too aggressively. His body may become painfully fused to the terrain while nearby people, weapons, portals, teleportation, movement routes, and loose objects are also unintentionally pinned.',
    weaknesses:
      'It is not teleportation and does not stop enemies from physically running away. Extremely powerful spatial beings can overpower it. It works best near Dumare and may not stop large-scale teleportation far outside his pressure range.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'anchor',
    visualPosition: { x: 770, y: 1110 },
    connectionTargets: [],
  },
  {
    id: 'impossible-outcome',
    number: 6,
    name: 'The Impossible Outcome',
    tier: 2,
    category: 'Ascendant Mastery & Influence',
    shortDescription: 'Creates one impossible survival path.',
    fullDescription:
      "Dumare's Dark Child evolves into his own chaos-born emergency contradiction. When every normal path leads to death, erasure, possession, or catastrophic defeat, his body creates one limited impossible outcome.",
    dmExample:
      'Dumare is about to be erased by an attack he cannot dodge, but reality glitches just enough for the attack to erase his shadow instead, giving him one chance to survive.',
    firstRollBacklash:
      'Contradiction Storm: Several impossible survival outcomes attempt to occur simultaneously. Dumare may survive the immediate threat, but reality resolves the contradictions unpredictably, creating new injuries, displaced consequences, or dangerous changes to the scene.',
    weaknesses:
      'Dumare does not choose the outcome. It is not a guaranteed win, not repeatable on command, and comes with severe strain. Enemies can still beat him afterward if he has no follow-up.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'impossible',
    visualPosition: { x: 230, y: 875 },
    connectionTargets: ['absolute-kinetic-dominion'],
  },
  {
    id: 'absolute-kinetic-dominion',
    number: 7,
    name: 'Absolute Kinetic Dominion',
    tier: 2,
    category: 'Ascendant Mastery & Influence',
    shortDescription: 'Controls kinetic force from motion and impacts.',
    fullDescription:
      'Dumare controls kinetic force from his own motion and impacts. Punches become shockwaves, claps become blasts, steps become quakes, and incoming force can be stored, redirected, or returned.',
    dmExample:
      'A giant strikes Dumare with a hammer; Dumare absorbs part of the impact, plants his feet, and returns it through a ground-cracking uppercut.',
    firstRollBacklash:
      'Motion Collapse: Dumare simultaneously leaks force from his own movements and steals momentum from nearby motion. Steps become quakes, flinches become blasts, and projectiles, spells, allies, enemies, machines, and falling objects may suddenly lose momentum that stores painfully inside him.',
    weaknesses:
      'It mainly works through motion, impact, and physical force. Energy attacks without kinetic pressure, force-nullifying fields, intangible attacks outside Achilles contact, or enemies that avoid impact exchanges can limit it.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'kinetic',
    visualPosition: { x: 365, y: 875 },
    connectionTargets: ['worldbreaker-physiology'],
  },
  {
    id: 'worldbreaker-physiology',
    number: 8,
    name: 'Worldbreaker Physiology',
    tier: 2,
    category: 'Ascendant Mastery & Influence',
    shortDescription: 'Routes strength through natural material.',
    fullDescription:
      'Dumare routes his strength, stance, grip, and impact through natural material as if the world itself is part of his body. Stone, metal, earth, wood, and natural structures can carry his force.',
    dmExample:
      'Dumare punches a stone wall, and the force travels through the building to erupt beneath the enemy hiding on the other side.',
    firstRollBacklash:
      "Uncontrolled World Conduction: Dumare's heartbeat, stance, grip, and impacts travel through unintended natural-material pathways. Force may erupt through floors, walls, weapons, armor, trees, stone, metal, or structures far from where he intended.",
    weaknesses:
      'Needs usable natural material. Synthetic, void-made, cursed, hexed, desecrated, or disconnected environments can weaken it. Enemies who fight in open air or sterile artificial spaces can reduce its reach.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'worldbreaker',
    visualPosition: { x: 500, y: 875 },
    connectionTargets: ['impossible-muscle-logic'],
  },
  {
    id: 'impossible-muscle-logic',
    number: 9,
    name: 'Impossible Muscle Logic',
    tier: 2,
    category: 'Ascendant Mastery & Influence',
    shortDescription: 'Performs physically impossible actions.',
    fullDescription:
      "Dumare's body performs physically impossible actions through mutated muscle logic: wrong-angle movement, no-leverage force, interrupted follow-through, overextension recovery, and impossible counters.",
    dmExample:
      'Dumare misses a punch while falling backward, but his muscles twist the failed motion into a sudden backhand from an angle that should not work.',
    weaknesses:
      'It still requires physical action. Full paralysis, total immobilization, body control effects, extreme exhaustion, or damage too severe to move can stop it. It also causes strain when abused.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'muscle',
    visualPosition: { x: 635, y: 875 },
    connectionTargets: ['artemis-rex'],
  },
  {
    id: 'artemis-rex',
    number: 10,
    name: 'Artemis Rex',
    tier: 2,
    category: 'Ascendant Mastery & Influence',
    shortDescription: 'Makes Dumare extremely hard to ignore or escape.',
    fullDescription:
      'Dumare becomes the unavoidable predator-center of combat. Enemies are not mind-controlled, but ignoring, kiting, bypassing, disengaging, or escaping him becomes much harder once he commits to the hunt or protection role.',
    dmExample:
      "Assassins try to run past Dumare toward civilians, but every path feels worse because Dumare's position, timing, and pressure keep making him the problem they must answer first.",
    firstRollBacklash:
      'Feral Center: The predator effect applies to everyone. Dumare becomes intensely feral and battlefield-focused, reacting aggressively to movement, fear, hidden intent, and perceived threats without initially distinguishing enemies from allies or civilians.',
    weaknesses:
      'It does not force enemies to attack him and does not make him invincible. Coordinated focus fire, battlefield traps, long-range bombardment, or enemies willing to sacrifice allies can still work if Dumare lacks movement or disruption support.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'predator',
    visualPosition: { x: 770, y: 875 },
    connectionTargets: [],
  },
  {
    id: 'oyas-breakline',
    number: 11,
    name: "Oya's Breakline",
    tier: 3,
    category: 'Supreme Dominion & Defiance',
    shortDescription: 'Breaks firing lines and formation timing.',
    fullDescription:
      'Dumare moves in violent pressure bursts that break firing lines, disrupt target locks, ruin formation timing, and let him create openings under siege fire.',
    dmExample:
      'A battalion locks weapons onto Dumare, but he bursts through the firing rhythm, kicking up debris and pressure waves that make their volley misfire.',
    firstRollBacklash:
      'Uncontrolled Breakstep: Every attempt to step, pivot, brace, or shift weight can trigger a violent dash in an unintended direction. Pressure bursts, debris, and disrupted formations erupt along the wrong paths.',
    weaknesses:
      'It does not make him untouchable. Predictive targeting, wide-area attacks, traps placed along his route, enclosed spaces, or enemies who do not rely on formation timing can counter it.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'breakline',
    visualPosition: { x: 230, y: 640 },
    connectionTargets: ['attrition-crown'],
  },
  {
    id: 'attrition-crown',
    number: 12,
    name: 'Attrition Crown',
    tier: 3,
    category: 'Supreme Dominion & Defiance',
    shortDescription: 'Repeated suppression becomes less effective.',
    fullDescription:
      "Dumare's Pain to Adapt becomes immediately useful. Repeated suppression, knockback, restraints, impact, or movement denial becomes progressively less effective at keeping him out of the fight.",
    dmExample:
      'A war machine keeps blasting Dumare backward. The first shots launch him, but each repeat teaches his body how to keep advancing through that same pressure.',
    firstRollBacklash:
      'Adaptation Flood: Pain to Adapt opens every stored injury and suppression experience at once. Dumare relives old wounds while his body produces multiple unstable adaptations, including responses to threats that are no longer present.',
    weaknesses:
      'It does not heal him or grant immunity. New attack types still work normally at first. Enemies who constantly change tactics, overwhelm him too quickly, or kill him before adaptation matters can bypass it.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'crown',
    visualPosition: { x: 365, y: 640 },
    connectionTargets: ['world-rooted-stance'],
  },
  {
    id: 'world-rooted-stance',
    number: 13,
    name: 'World-Rooted Stance',
    tier: 3,
    category: 'Supreme Dominion & Defiance',
    shortDescription: 'Extremely hard to move while grounded.',
    fullDescription:
      'While touching usable natural material, Dumare becomes extremely hard to knock down, throw, drag, stagger, suppress, or move against his will.',
    dmExample:
      "A metal giant tries to shoulder-check Dumare through a building, but Dumare's feet root into the stone and the impact fails to move him cleanly.",
    weaknesses:
      'Requires contact with usable natural material. Airborne combat, artificial floors, cursed ground, desecrated land, void terrain, or attacks that remove the ground beneath him can weaken it.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'stance',
    visualPosition: { x: 500, y: 640 },
    connectionTargets: ['gaia-reclamation'],
  },
  {
    id: 'gaia-reclamation',
    number: 14,
    name: 'Gaia Reclamation',
    tier: 3,
    category: 'Supreme Dominion & Defiance',
    shortDescription: 'Cleanses or contests corrupted land.',
    fullDescription:
      'Dumare can contest and cleanse hexed or desecrated land enough to reconnect with his natural bloodline abilities and make the area usable again.',
    dmExample:
      "A demon corrupts the battlefield, shutting off Dumare's earth abilities, so Dumare drives his hand into the soil and forces a small clean patch open beneath him.",
    firstRollBacklash:
      "Territorial Rejection: The land violently argues with Dumare's attempt to reclaim it. Roots, stone, soil, corruption, and anti-corruption forces erupt together, potentially attacking everything nearby while the ground decides whether to accept him.",
    weaknesses:
      'Strong desecration, active enemy rituals, cursed anchors, or divine-level corruption can resist or reverse the reclamation. It may start small and require pressure, contact, or time to spread.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'gaia',
    visualPosition: { x: 635, y: 640 },
    connectionTargets: ['law-resistant-biology'],
  },
  {
    id: 'law-resistant-biology',
    number: 15,
    name: 'Law-Resistant Biology',
    tier: 3,
    category: 'Supreme Dominion & Defiance',
    shortDescription: 'Resists imposed rules and death effects.',
    fullDescription:
      "Dumare's body starts resisting imposed rules, including gravity manipulation, time pressure, forced weakness, soul separation, conceptual binding, death effects, and existence-removal pressure.",
    dmExample:
      "An enemy declares that Dumare's strength is cut in half by a supernatural law, but his body rejects the rule enough to keep fighting near full output for a short window.",
    weaknesses:
      'It resists imposed rules; it does not erase them automatically. Stronger laws, layered effects, direct divine authority, or reality effects beyond his current tier can still overpower him.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'law',
    visualPosition: { x: 770, y: 640 },
    connectionTargets: [],
  },
  {
    id: 'calamity-interception',
    number: 16,
    name: 'Calamity Interception',
    tier: 4,
    category: 'Apotheosis & Final Transcendence',
    shortDescription: 'Intercepts catastrophes and stays in the fight.',
    fullDescription:
      'When Dumare senses a calamity-level attack or catastrophic event beginning, his body can force a direct interception path toward the source, impact point, victim, or failure point. During the interception, his body triggers a temporary survival response tailored to that specific calamity. If the calamity is force, his frame reinforces. If it is destructive light, his body develops temporary light-pressure tolerance. If it is infinite darkness, his senses and body fight to remain defined inside it. If it is soul fire, his body hardens the boundary between flesh, mana, and soul. If it is alchemical collapse, his biology resists being rewritten long enough to act. This does not negate the calamity, erase the damage, or guarantee he stops it completely. It lets Dumare intercept the event and remain combat-capable afterward instead of being instantly removed from the battle.',
    dmExample:
      "A Calamity Blade of Fire releases a soul-burning strike that would erase its target from body to spirit. Dumare's Calamity Sense spikes, and Calamity Interception forces him into the path of the strike. His body temporarily hardens the boundary between flesh, mana, and soul so he can take the hit and stay in the fight afterward. He is still directly soul-burned by the attack, but he is not instantly removed from battle.",
    firstRollBacklash:
      "False Emergency Vector: Dumare's Calamity Sense spikes and forcibly launches him toward what it identifies as the nearest source, victim, impact point, or failure point. It may choose the wrong location, wrong person, or wrong part of the catastrophe.",
    weaknesses:
      'Only helps against calamity-level attacks or catastrophic events Dumare can physically reach, intercept, or meaningfully contest. Too many simultaneous calamities, instant no-travel effects, teleporting disasters, decoys, attacks outside his movement range, events with no reachable source or failure point, or weapons designed to punish interception can overwhelm it. It does not cancel calamities, make Dumare immune, or guarantee victory. It is an extremely limited emergency interception, not a repeatable defensive move.',
    specialRules:
      'Extreme use limit: Calamity Interception can only be used once per story arc, once per true calamity event, or only when the DM agrees the threat qualifies as a genuine catastrophe. Built-in cost: Dumare takes the calamity directly by himself; the aftermath depends on what hit him.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'calamity',
    visualPosition: { x: 260, y: 405 },
    connectionTargets: ['convergence-engine'],
  },
  {
    id: 'momentum-theft',
    number: 17,
    name: 'Momentum Theft',
    tier: 4,
    category: 'Apotheosis & Final Transcendence',
    shortDescription: 'Steals momentum and stores it.',
    fullDescription:
      'Dumare can steal momentum from moving targets at mid to long range and store it for his next physical action. The target still follows its original motion path and keeps the same final outcome if it completes. Against spells, Dumare steals the prepaid motion portion of the casting cost, forcing the spell to pull more from the caster until it completes, ends, or is cancelled. Physical touch makes the theft parasitic, draining the caster, controller, or owner for a portion of what Dumare stole.',
    dmExample:
      'A mage launches a fireball. Dumare steals its momentum, causing it to crawl forward while still remaining fully dangerous. The spell pulls more mana from the caster to complete the motion Dumare stole.',
    weaknesses:
      'It does not cancel effects, weaken final outcomes, change the endpoint, or prevent consequences. Ranged theft is weaker than touch theft. Spells that can be cancelled instantly, attacks with no meaningful motion, or enemies who bait Dumare into storing too much momentum can counter it.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'momentum',
    visualPosition: { x: 420, y: 405 },
    connectionTargets: ['convergence-engine'],
  },
  {
    id: 'solar-tyrant-physiology',
    number: 18,
    name: 'Solar Tyrant Physiology',
    tier: 4,
    category: 'Apotheosis & Final Transcendence',
    shortDescription: 'Black Superman / Plutonian-style superbeing passive.',
    fullDescription:
      'Dumare develops Black Superman/Plutonian-style superbeing physiology. He gains body-based super senses, oppressive heroic presence, disciplined force control, and lethal composure. His glare, voice, breath, silence, and presence carry physical pressure, and he can shift from restraint to killing force against a proven evil threat without rage, hesitation, or wasted motion.',
    dmExample:
      'A villain tries to bluff while charging a hidden weapon. Dumare hears the heartbeat shift, feels the weapon hum, steps forward, and his silent glare pressures the room before he ends the threat cleanly.',
    firstRollBacklash:
      "Tyrant Flare: Dumare's enhanced senses, voice, glare, silence, presence, and force control activate at full intensity. He hears and feels too much while unintentionally pressuring, frightening, stunning, or physically affecting everyone nearby.",
    weaknesses:
      'It does not grant mind control, automatic fear, perfect prediction, full light manipulation, restraint immunity, or power synchronization. Strong enemies can push through his pressure, and lethal composure does not make every lethal decision morally correct.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'solar',
    visualPosition: { x: 580, y: 405 },
    connectionTargets: ['convergence-engine'],
  },
  {
    id: 'muscle-supremacy-mandate',
    number: 19,
    name: 'Muscle Supremacy Mandate',
    tier: 4,
    category: 'Apotheosis & Final Transcendence',
    shortDescription: 'Overpowers almost anything physically.',
    fullDescription:
      "Dumare's body reaches heavy Mash Burndead-style physical supremacy. If something can be interacted with through strength, pressure, leverage, grip, flexing, striking, stomping, jumping, throwing, bracing, or collision, Dumare can attempt to overpower it through absurd physical dominance.",
    dmExample:
      'A flying enemy thinks they are safe above him, so Dumare kicks off the air itself for one impossible step and drives a punch into them midair.',
    firstRollBacklash:
      "Wrong Impossible Solution: Dumare's body attempts several impossible physical solutions at once and chooses the wrong problem to overpower. He may strike, brace, grip, twist, kick off the air, or redirect force with catastrophic excess and little control.",
    weaknesses:
      'It only works through physical action. If Dumare cannot move, strike, grip, brace, flex, stomp, or collide, this power cannot solve it for him. Non-physical problems, pure mind attacks, or effects outside any physical interaction can bypass it.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'mandate',
    visualPosition: { x: 740, y: 405 },
    connectionTargets: ['convergence-engine'],
  },
  {
    id: 'convergence-engine',
    number: 20,
    name: 'Convergence Engine',
    tier: 'convergence',
    category: 'Final Synchronization',
    shortDescription: 'Syncs active powers into one combat style.',
    fullDescription:
      "Dumare's active D20 powers begin working together instead of operating separately. Compatible powers naturally feed into each other without requiring separate focus, turning the entire tree into one synchronized combat style.",
    dmExample:
      "Dumare launches into flight, breaks the enemy formation with Oya's Breakline, steals a spell's momentum mid-charge, and releases it through an Absolute Kinetic Dominion punch carrying Stormlight Current.",
    firstRollBacklash:
      'System Collision: Multiple manifested powers activate through the same action with the wrong timing, targets, pathways, and interpretations. Instead of cooperating, they collide and produce an unstable combined effect. A second natural 20 may trigger an early Living Answer backlash without unlocking it.',
    weaknesses:
      'It only synchronizes powers Dumare has already manifested. It does not unlock powers early, create new powers by itself, or make every combo safe. Overloading too many powers at once can strain his body or create collateral damage.',
    convergenceSynergies:
      'Compatible manifested powers naturally feed into each other as one synchronized combat style.',
    specialRules:
      'Convergence Engine is part of the D20 list in the current DOCX. The document does not mark it as milestone-only, so it remains randomly selectable while The Living Answer remains excluded from random rolls.',
    selectable: true,
    milestoneControlled: false,
    requiredForLivingAnswer: true,
    iconKey: 'convergence',
    visualPosition: { x: 500, y: 245 },
    connectionTargets: ['living-answer'],
  },
]

export const livingAnswer: LivingAnswerDefinition = {
  id: 'living-answer',
  name: 'The Living Answer',
  shortDescription: 'Final Gaia + Chaos + Dominance culmination.',
  unlockRequirement:
    'The Living Answer is not part of the D20 roll list. It can only be unlocked after Dumare completes the entire D20 superpower tree and manifests all 20 powers.',
  fullDescription:
    "The Living Answer is the final Gaia + Chaos + Dominance culmination. Dumare's body, bloodline, chaos-born biology, dominance path, and stabilized powers stop functioning like separate manifestations and become one complete answer to impossible conflict. He becomes capable of meaningfully fighting almost anything, even if higher cosmic or outerversal beings can still overpower him.",
  dmExample:
    "A cosmic avatar tries to erase Dumare from the fight, but Dumare's completed tree lets him survive contact long enough to interfere, protect others, and land one meaningful blow.",
  weaknesses:
    'The Living Answer does not mean Dumare beats anything automatically. True outerversal beings, absolute authorities, and enemies far beyond the world ceiling can still defeat him. It gives Dumare relevance, presence, and a fighting chance against almost anything, not guaranteed victory.',
  visualPosition: { x: 500, y: 105 },
}

export const tierLabels = [
  { tier: 4, title: 'Tier 4', subtitle: 'Apotheosis & Final Transcendence', y: 405 },
  { tier: 3, title: 'Tier 3', subtitle: 'Supreme Dominion & Defiance', y: 640 },
  { tier: 2, title: 'Tier 2', subtitle: 'Ascendant Mastery & Influence', y: 875 },
  { tier: 1, title: 'Tier 1', subtitle: 'Foundations of Power', y: 1110 },
] as const

export const orderedPowerIds = powers.map((power) => power.id)
