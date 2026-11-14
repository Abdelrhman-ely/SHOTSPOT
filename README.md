# SHOTSPOT

**A miss-tolerant landing-site planner for the lunar south pole.**

SHOTSPOT compares candidate landing areas using terrain, Sun and Earth visibility, and landing-position uncertainty. The current demo includes three sites from NASA GSFC PGDA Product 78: Site01 Connecting Ridge, Site20 Leibnitz Beta Plateau, and Site23 Malapert Massif.

## Try the website

The Angular website uses the precomputed files in `web/data/`; you do not need to download the large raw NASA datasets to run the demo.

```bash
cd frontend
npm install
npm start
```

Open <http://localhost:4200>. The site has **Home**, **Planner**, and **Sources & Limits** pages.

To create a production build:

```bash
cd frontend
npm run build
```

## How the project is organized

```text
frontend/       Angular website and in-browser planning interface
web/data/       Precomputed site data used by the website
pipeline/       Python tools for terrain, horizons, ephemerides, and site generation
tests/          Synthetic-terrain tests for the horizon calculations
data/validation/ Saved Sun/Earth angle comparisons against NASA JPL Horizons
docs/           Black-and-white research-paper style project document
```

The Python pipeline uses LOLA terrain data, NAIF SPICE kernels, and NASA JPL Horizons validation. Its main steps are:

- `terrain.py` loads terrain and handles polar stereographic coordinates.
- `horizon.py` computes terrain horizons around candidate landing spots.
- `ephemeris.py` computes Sun and Earth positions using SPICE.
- `validate_horizons.py` compares calculated Sun/Earth angles with JPL Horizons.
- `build_site.py` generates the processed site files consumed by the website.

## Rebuild the processed site data (optional)

Only do this if you need to regenerate `web/data/`. The raw NASA source data is not stored in this repository; it is about 856 MB. `download_data.sh` lists estimated download sizes by default and downloads nothing unless you add `--go`.

```bash
# From the repository root: preview the download sizes (no files downloaded)
bash download_data.sh

# Download the source data required by the pipeline
bash download_data.sh --go

# Create a Python environment and install pipeline dependencies
python3 -m venv .venv
.venv/bin/pip install numpy rasterio spiceypy scipy numba requests pillow

# Regenerate all three sites
.venv/bin/python pipeline/build_site.py
```

See [DATA_LINKS.md](DATA_LINKS.md) for NASA source links, dataset details, and download options. To validate the downloaded PGDA GeoTIFFs, run:

```bash
.venv/bin/pip install numpy rasterio
.venv/bin/python verify_data.py
```

`verify_data.py` is a data-quality helper: it reports raster dimensions, resolution, nodata range, and whether files for each site share a grid. It does not run the website or rebuild processed site data.

## Validation and limitations

- The saved ephemeris checks compare Sun and Earth angles against JPL Horizons; the documented maximum difference is 0.0001° across 20 samples.
- The horizon tests cover a flat spherical surface and a synthetic 100 m wall at 4 km.
- Visibility means the center of the Sun or Earth is above the modeled terrain horizon. It does not estimate power or communications link quality.
- Landing drift is a user-provided circular uncertainty area, not a predicted landing distribution.
- The demo aim points are selected by the team and are not official mission targets. Small hazards are not resolved by the current analysis.
- Future work may explore computer-vision-based crater and surface-hazard mapping from high-resolution lunar imagery; that capability is not part of the current analysis.

## License and data

NASA datasets used by the project are publicly available from their respective sources. See [DATA_LINKS.md](DATA_LINKS.md) for attribution and source details. Add a project license here if the team has selected one.
