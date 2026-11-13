# SHOTSPOT — Lunar South Pole Data (LOLA 5 m/px, PGDA product 78)

The raw data is not in the repository (~0.86 GB, and one file is over GitHub's 100 MB limit).
Everything is public NASA data; one command downloads all of it.

You only need it to rerun the pipeline (`build_site.py`). The website works without it,
because the processed data is already in `web/data/`.

## Download

```bash
bash download_data.sh        # dry run: lists every file and its size, downloads nothing
bash download_data.sh --go   # downloads everything build_site.py needs (~856 MB, 22 files)
```

| What | Saved to | Source |
|---|---|---|
| PGDA 78 LOLA 5 m/px DEMs, 3 sites × 5 layers | `data/raw/pgda78/<Site>/` | [NASA GSFC PGDA product 78](https://pgda.gsfc.nasa.gov/products/78) |
| LOLA GDR polar DEM 120 m/px (`LDEM_75S_120M.IMG/.LBL`), far-field terrain | `data/raw/lola_gdr/` | [NASA PDS Geosciences Node](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/IMG/) |
| NAIF SPICE kernels: `naif0012.tls`, `de421.bsp`, `pck00010.tpc`, `moon_pa_de421_1900-2050.bpc`, `moon_080317.tf` | `data/spice/` | [NAIF generic kernels](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) |

Options: `--sites "Site20"` and `--files "surf slp"` limit the PGDA files, `--clones 1` adds a Monte-Carlo DEM clone,
`--no-extras` skips the 120 m DEM and the SPICE kernels. Interrupted downloads resume when you run it again.
Check the downloaded PGDA files with `python verify_data.py`.

## Format (same for every file)

- GeoTIFF, 1 band, `float32`, nodata = NaN, 5 m per pixel
- Projection: polar stereographic, south pole — `+proj=stere +lat_0=-90 +lat_ts=-90 +lon_0=0 +x_0=0 +y_0=0 +R=1737400 +units=m`
- Elevations are relative to a sphere of radius 1737.4 km (negative values are normal)
- Within a site, all files share the exact same grid, so they stack pixel for pixel

## Files per site

| Code | File | Meaning |
|---|---|---|
| `surf` | `<Site>_final_adj_5mpp_surf.tif` | DEM — elevation (m) |
| `slp` | `<Site>_final_adj_5mpp_slp.tif` | Slope (degrees) |
| `slperr` | `<Site>_final_adj_5mpp_slperr.tif` | Slope uncertainty (degrees) |
| `toterr` | `<Site>_final_adj_5mpp_toterr.tif` | Total height uncertainty (m) |
| `ldec` | `<Site>_final_adj_5mpp_ldec.tif` | Real LOLA laser shots per pixel (used for "weakly constrained terrain") |
| clones | `Clones/<Site>_final_adj_5mpp_0001_err.tif` | Monte-Carlo clone of the DEM (optional, `--clones 1`) |

| Site | Center | Size |
|---|---|---|
| Site01 — Connecting ridge | lat −89.46°, lon −137.49° | 3200×3200 px (16×16 km) |
| Site20 — Leibnitz beta plateau | lat −85.43°, lon 31.74° | 3200×3200 px (16×16 km) |
| Site23 — Malapert massif | lat −86.00°, lon −0.24° | 4200×4200 px (21×21 km) |

The team also keeps a copy in a private S3 bucket. Ask a maintainer for access; never commit keys or signed links.
