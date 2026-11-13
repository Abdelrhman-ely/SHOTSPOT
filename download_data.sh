#!/usr/bin/env bash
# download_data.sh - PGDA 78 (LOLA 5 m/pixel south pole DEMs) downloader for SHOTSPOT
#
# SAFE BY DEFAULT: without --go it only prints the file sizes. Nothing is downloaded.
# Source page: https://pgda.gsfc.nasa.gov/products/78
#
# Examples
#   bash download_data.sh                                   # sizes of the default 12 files (no download)
#   bash download_data.sh --sites "Site20" --files "surf"   # size of one file
#   bash download_data.sh --sites "Site20" --files "surf slp slperr toterr" --go
#   bash download_data.sh --sites "Site20" --files "" --clones 1 --go
#   bash download_data.sh --go --s3 s3://my-bucket/raw/pgda78
#
# File codes (--files): surf = DEM, slp = slope, slperr = slope uncertainty, toterr = total height uncertainty

set -euo pipefail

BASE="https://pgda.gsfc.nasa.gov/data/LOLA_5mpp"
SITES="Site20 Site01 Site23"
FILES="surf slp slperr toterr"
CLONES=0
OUT="data/raw/pgda78"
GO=0
S3=""

usage() {
  sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
}

while [ $# -gt 0 ]; do
  case "$1" in
    --sites)  SITES="$2";  shift 2 ;;
    --files)  FILES="$2";  shift 2 ;;
    --clones) CLONES="$2"; shift 2 ;;
    --out)    OUT="$2";    shift 2 ;;
    --s3)     S3="$2";     shift 2 ;;
    --go)     GO=1;        shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 1; }

items=()
for S in $SITES; do
  for F in $FILES; do
    items+=("$S|$BASE/$S/${S}_final_adj_5mpp_${F}.tif")
  done
  for ((i=1; i<=CLONES; i++)); do
    n=$(printf "%04d" "$i")
    items+=("$S/Clones|$BASE/$S/Clones/${S}_final_adj_5mpp_${n}_err.tif")
  done
done

if [ "${#items[@]}" -eq 0 ]; then
  echo "Nothing selected. Check --sites / --files / --clones." >&2
  exit 1
fi

size_of() {
  curl -sIL "$1" 2>/dev/null | awk 'tolower($1)=="content-length:" {print $2}' | tail -1 | tr -d '\r' || true
}

total=0
if [ "$GO" -eq 0 ]; then
  echo "DRY RUN (no download). Add --go to download. ${#items[@]} file(s):"
fi

for item in "${items[@]}"; do
  dir="${item%%|*}"
  url="${item#*|}"
  if [ "$GO" -eq 1 ]; then
    mkdir -p "$OUT/$dir"
    echo "Downloading $url"
    curl -fL -C - --progress-bar -o "$OUT/$dir/$(basename "$url")" "$url"
  else
    sz="$(size_of "$url")"
    if [ -n "$sz" ]; then
      printf '%8d MB  %s\n' "$(( sz / 1024 / 1024 ))" "$url"
      total=$(( total + sz ))
    else
      printf '%11s  %s\n' "size n/a" "$url"
    fi
  fi
done

if [ "$GO" -eq 0 ]; then
  echo "Total reported: $(( total / 1024 / 1024 )) MB (files without a reported size are not counted)"
  exit 0
fi

echo "Done. Files are in $OUT"

if [ -n "$S3" ]; then
  command -v aws >/dev/null 2>&1 || { echo "aws CLI is required for --s3" >&2; exit 1; }
  aws s3 sync "$OUT" "$S3" --exclude "*.xyzi" --exclude "*.tgz"
  echo "Uploaded to $S3"
fi
