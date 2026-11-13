# SHOTSPOT — Lunar South Pole Data (LOLA 5 m/px, PGDA product 78)

Source: NASA GSFC PGDA product 78 — https://pgda.gsfc.nasa.gov/products/78
The raw data is not in the repository (it is ~0.9 GB). Download it from NASA with `download_data.sh`.

## Download

```bash
bash download_data.sh                                              # dry run: lists files and sizes
bash download_data.sh --files "surf slp slperr toterr ldec" --go   # downloads into data/raw/pgda78/
```

`build_site.py` also needs the far-field DEM `data/raw/lola_gdr/LDEM_75S_120M.{IMG,LBL}` (PDS LOLA GDR)
and the SPICE kernels in `data/spice/` (see README).

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
