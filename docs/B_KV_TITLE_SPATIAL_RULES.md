# B KV Title Spatiality Rules — Handoff 1.0.1

This document mirrors `PP-Food-Runtime-001 1.0.1` title-spatiality behavior. Do not reinterpret it as a separate design system.

## Core hierarchy

- Product = visual hero #1.
- Headline = visual hero #2.
- Subtitle/supporting-title = secondary spatial anchor.

## Hard anti-flatness rule

A B candidate must not present headline or subtitle/supporting-title as a flat 2D overlay that could be removed like a pasted Photoshop text layer without materially changing the scene.

The title system needs visible spatial evidence through one or more of:

- perspective / foreshortening;
- extrusion, bevel, relief, layered thickness or offset planes;
- foreground/midground/background crossing;
- product/type overlap or occlusion;
- embedded/suspended/wrapped/depth-bearing carrier;
- contact/cast shadow consistent with the scene;
- shared key/rim light, reflection, highlight, smoke, particle or atmosphere interaction;
- scale/plane separation between headline and subtitle/supporting-title.

Literal thick 3D extrusion is **not mandatory for every category**. Restrained editorial categories can satisfy the contract with perspective, layered planes, overlap/occlusion and integrated light/shadow. Spatial integration is mandatory; one universal 3D style is not.

## Headline / subtitle relationship

When both are visible:

1. They must not share one identical flat plane, angle, scale logic and light response.
2. Headline has stronger mass and spatial pressure.
3. Subtitle/supporting-title must occupy a distinct secondary depth role.
4. Their spatial system must support the food/product rather than become a giant signboard that demotes it.

## Production Gate

Failure code:

```text
TITLE_SPATIALITY_WEAK
```

This is a Production Fast delivery hard gate.

Targeted creative retry must preserve:

- current Stage A reference;
- Product Truth/Product DNA;
- exact authorized copy;
- already-passing visual dimensions.

Repair only:

- title depth;
- perspective / foreshortening;
- overlap / occlusion;
- material response;
- scene-light integration;
- headline/subtitle depth separation.

Never solve spatiality by shrinking or demoting the product.

## Evaluator evidence

QC must judge visible pixels and cite where the title shows or lacks:

- perspective;
- depth separation;
- overlap/occlusion;
- carrier/material thickness;
- shared scene light/shadow;
- product/type spatial interaction.

Related but distinct codes remain available: `HEADLINE_WEAK`, `TYPOGRAPHY_DISCONNECTED`, `PHOTO_PLUS_TEXT`, `COMPOSITION_FLAT`.

## Forbidden shortcuts

- flat headline + flat subtitle over a finished food photograph;
- headline/subtitle centered as one planar text block;
- fake depth made only by a generic drop shadow unrelated to scene light;
- universal wood-sign, black-gold or neon-sign treatment regardless of category;
- giant signboard/architecture becoming the hero;
- 3D lettering that forces product shrinkage or masks product identity.
