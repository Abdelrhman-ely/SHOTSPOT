# SHOTSPOT MVP: miss-tolerant landing planner

Three PGDA 78 sites at the lunar south pole: **Site20 Leibnitz beta plateau, Site01 Connecting ridge,
Site23 Malapert massif**, with site and date comparison.

```
pipeline/  (Python, offline: layers 1-3)
  terrain.py            LOLA DEMs + polar-stereographic math
  horizon.py            terrain horizon per spot, 360 azimuths, out to 250 km (numba)
  ephemeris.py          Sun/Earth az/el from NAIF SPICE (MOON_ME, DE421)
  validate_horizons.py  checks our angles against NASA JPL Horizons
  build_site.py         precomputes each site into web/data/<site>/ and writes web/data/sites.json
web/data/  (precomputed site data read by the website)
frontend/  (Angular website: layer 4, decision runs in the browser)
tests/     synthetic-terrain tests for the horizon engine
```

## Run

```bash
python3 -m venv .venv && .venv/bin/pip install numpy rasterio spiceypy scipy numba pytest requests pillow
.venv/bin/python -m pytest -q tests                     # horizon engine tests
cd pipeline && ../.venv/bin/python validate_horizons.py  # vs JPL Horizons (needs internet)
../.venv/bin/python build_site.py && cd ..               # all sites, ~11 s each (or: build_site.py Site23)
```

Raw data (not in the repo, ~856 MB, all public NASA data): `bash download_data.sh --go` downloads the PGDA 78 layers,
the 120 m LOLA GDR polar DEM and the 5 SPICE kernels into `data/`. See `DATA_LINKS.md`. Only needed to rerun the pipeline.

## Frontend (Angular)

`frontend/` is the website: Home, Planner (mission & sky, landing accuracy, compare on one page) and About. It reads the same
precomputed data from `web/data/` (the Python pipeline output), so rebuild the data with `build_site.py` as before.

```bash
cd frontend && npm install && npm start   # open http://localhost:4200
npm run build                             # static build in frontend/dist/frontend/browser
```

The decision engine lives in `frontend/src/app/core/` (engine.ts, analysis.ts, draw.ts, store.ts).

## What is checked

- Sun and Earth angles vs JPL Horizons: max difference 0.0001 deg (20 times, target 0.01 deg).
- Horizon engine: flat sphere and a 100 m wall at 4 km (1.366 deg with curvature).
- 5 m tile vs 120 m polar DEM: mean height difference 1.9 m, so they can be stitched.

## Known limits and future work

- The demo aim point is our choice (plateau top). The IM-2 Athena spot is outside every PGDA 78 tile.
- Visibility = body center above the horizon, 10-minute sampling. Not power, not link quality.
- Drift = uniform circle (an input, not a prediction). 30 m spot grid over +-1.2 km.
- Future work: explore computer-vision crater and surface-hazard mapping from high-resolution lunar imagery; it is not part of the current analysis.
- Other future work: more PGDA 78 sites and documented comparison with NASA QuickMap / Moon Trek.
