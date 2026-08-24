# SSBU Frame Glossary

This project uses real Super Smash Bros. Ultimate game frames only. SSBU runs at 60 frames per second; one frame is about 16.67 ms. The web app must not introduce an alternate timing unit.

## Startup
Frames before a move's relevant hitbox first becomes active. A move listed as frame 5 can first hit on frame 5; frames 1-4 are startup.

## Active frames
Frames where an attack hitbox exists. Early and late portions of a move may have different hitboxes, damage, angles, or knockback.

## Recovery / FAF
Recovery is the period after the attack's hitbox ends while the attacker is still committed. FAF means First Actionable Frame: the first frame on which the character can perform a new action. Sources sometimes list total frames instead of FAF, so the app must label the convention it uses.

## Landing lag
The vulnerable/committed frames after landing during an aerial's landing-lag window. Landing close to the ground can make aerial pressure safer because less time passes before the landing occurs, but the move's listed landing lag still matters.

## Autocancel
Aerials have frame windows where landing avoids their move-specific landing lag and instead uses normal landing behavior. Autocancel windows are move-specific.

## Hitlag
The short impact freeze when a move connects. Smash Directional Influence (SDI) is performed during hitlag. Hitlag is not the same thing as hitstun.

## Hitstun
Time after launch during which the victim cannot act. A combo is genuinely true only when the next hit connects before the victim receives an actionable frame, under the stated conditions.

## Shield advantage
How many frames earlier or later the attacker can act after a move is blocked. Negative values favor the defender; positive values favor the attacker. Whether a punish actually reaches still depends on spacing, pushback, shieldstun mechanics, and the defender's available option.

## Out of shield (OOS)
An option used directly from shield. Aerial OOS timings include Ultimate's 3-frame jumpsquat. Up smash and up special can be performed directly out of shield without waiting through normal shield release.

## DI and SDI
Directional Influence (DI) changes launch trajectory. Smash Directional Influence (SDI) shifts the character during hitlag. Both can change whether a route connects, so the guide distinguishes universal claims from DI-, target-, or position-dependent routes.

## True combo
"True" is reserved for routes whose next hit lands before the defender can act under the documented conditions. A route that merely works often, catches common DI, or is useful to drill is labeled differently.
