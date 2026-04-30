# Category Taxonomy

Canonical list of categories used by every factor. Keep this list tight; proliferation is the enemy of search.

| Category | When to use | Example activities |
|---|---|---|
| `electricity` | Any factor where the denominator is electrical energy at consumption | Grid electricity by country, renewable PPA residual |
| `fuels` | Combustion of a fuel, upstream or direct | Natural gas, diesel, petrol, coal, biomass, hydrogen |
| `transport` | Movement of people or goods, whether by mode or by passenger/tonne-km | Cars, trucks, trains, aviation, shipping, public transit |
| `refrigerants` | Fugitive emissions from refrigerants and SF6 | HFC-134a, R-410A, SF6 |
| `waste` | Waste treatment pathways and their emissions | Landfill, incineration, composting, recycling |
| `water` | Water supply and wastewater treatment | Potable water supply, wastewater treatment |
| `agriculture` | Agricultural activities, livestock, fertilisers | Enteric fermentation, manure management, N-fertiliser |
| `lulucf` | Land use, land-use change, and forestry | Deforestation, afforestation, peatland conversion |
| `construction` | Embodied carbon of construction materials | Cement, steel, aluminium, concrete, timber |
| `materials` | Embodied carbon of general materials not construction | Plastics, paper, glass, textiles |
| `sector_spend` | Spend-based Scope 3 factors (EEIO) | USEEIO BEA commodities, EXIOBASE sectors |
| `gwp` | Global warming potentials, standalone references | CH4 AR6 100yr, N2O AR6 20yr, SF6 AR6 100yr |
| `other` | Anything that does not fit above | Rare; flag for review during ingestion |

## Sub-category conventions

Sub-categories are free-form but should be consistent within a category. Common examples:

- `electricity`: `grid`, `residual_mix`, `ppa`, `diesel_generator`, `off_grid`
- `fuels`: `natural_gas`, `diesel`, `petrol`, `lpg`, `coal`, `hydrogen`, `biofuel`, `heavy_fuel_oil`, `jet_kerosene`
- `transport`: `road_passenger`, `road_freight`, `rail_passenger`, `rail_freight`, `aviation_domestic`, `aviation_international`, `shipping`, `public_transit`
- `refrigerants`: list by substance
- `waste`: `landfill`, `incineration_with_recovery`, `incineration_without_recovery`, `composting`, `recycling`, `anaerobic_digestion`, `wastewater`
- `agriculture`: `enteric_fermentation`, `manure_management`, `crop_residues`, `synthetic_fertiliser`, `organic_fertiliser`, `rice_cultivation`

When in doubt, pick the closest existing sub-category rather than inventing a new one. Proliferation breaks search.
