"""
APX Classic (non-Verra) registries: ACR and CAR.

Both run on the older APX ASP Classic backend (different host, same
HTML structure). The UI has a "Public Reports" area; each report has
a CSV download button that submits `frmDownload` to
/myModule/include/rptdownload.asp. We replay that form POST directly:

  1. GET  /mymodule/rpt/myRpt.asp?r=<report_id>       (establishes session,
                                                       returns HTML with the
                                                       frmDownload form fields)
  2. POST /myModule/include/rptdownload.asp            with all hidden form
                                                       fields (including a
                                                       per-session c16e nonce
                                                       in CAR's case) and
                                                       FormatType=csv

Response: the full CSV for the report, no pagination. Projects for ACR
come back in ~460 KB, CAR in ~1 MB, all in one request.

Report IDs tested:
  r=111  Projects (ACR + CAR)
  r=112  Compliance Projects (CAR-only relevant)
  r=113  Project Credits Issued
  r=114  Retired Credits (may differ)
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

import click
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential_jitter

REPO_DATA = Path("data")

REGISTRIES = {
    "acr": {
        "host": "https://acr2.apx.com",
        "name": "American Carbon Registry",
        "dir": REPO_DATA / "acr",
        # Report IDs scraped from /mymodule/mypage.asp nav on 2026-04-18
        "reports": {
            "projects": 111,
            "credits_issued": 112,
            "retired_credits": 206,
            "cancelled_credits": 208,
        },
    },
    "car": {
        "host": "https://thereserve2.apx.com",
        "name": "Climate Action Reserve",
        "dir": REPO_DATA / "car",
        "reports": {
            "projects": 111,
            # Some CAR reports require an extra query param (TabName) that
            # the nav link sends. Use a dict form: {"r": id, "params": {...}}.
            "compliance_projects": {"r": 211, "params": {"TabName": "ARB"}},
            "credits_issued": 112,
            "retired_credits": 206,
            "cancelled_credits": 308,
            "credit_status": 309,
            "buffer_pool": 706,
            "ods_destruction": 210,
        },
    },
    "art": {
        "host": "https://art.apx.com",
        "name": "ART TREES (Architecture for REDD+ Transactions)",
        "dir": REPO_DATA / "art",
        "reports": {
            "projects": 111,
            "credits_verified": 112,
            "credit_status": 212,
            "retired_credits": 206,
            "cancelled_credits": 208,
            "buffer_pool": 209,
            "article6_corsia": 213,
        },
    },
}

# Backward-compatible shorthand: any report name referenced across all
# three registries uses the same key, even if the underlying r=ID differs.
ALL_REPORT_KEYS = sorted({k for r in REGISTRIES.values() for k in r["reports"]})

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
}


# Robust-ish HTML-entity decoder for the attribute values APX emits.
# They use numeric entities heavily (&#44; for comma etc.).
def decode_entities(s: str) -> str:
    def _sub(m: re.Match) -> str:
        code = m.group(1)
        try:
            return chr(int(code))
        except ValueError:
            return m.group(0)
    return re.sub(r"&#(\d+);", _sub, s)


def extract_download_form(html: str) -> dict[str, str]:
    """
    Pull all hidden input fields from the <FORM name="frmDownload">
    block so we can replay the CSV export with exact session state.
    """
    form_match = re.search(
        r"<FORM[^>]*id=[\"']frmDownload[\"'][^>]*>([\s\S]*?)</FORM>",
        html,
        re.IGNORECASE,
    )
    if not form_match:
        raise RuntimeError("frmDownload form not found in report HTML")

    body = form_match.group(1)
    fields: dict[str, str] = {}
    for inp in re.finditer(
        r"<INPUT\b[^>]*>",
        body,
        re.IGNORECASE,
    ):
        tag = inp.group(0)
        name_m = re.search(r'name\s*=\s*["\']([^"\']+)["\']', tag, re.IGNORECASE)
        value_m = re.search(r'value\s*=\s*["\']([^"\']*)["\']', tag, re.IGNORECASE)
        if not name_m:
            continue
        name = decode_entities(name_m.group(1))
        value = decode_entities(value_m.group(1)) if value_m else ""
        fields[name] = value

    fields["FormatType"] = "csv"
    return fields


def _resolve_report(spec) -> tuple[int, dict[str, str]]:
    """Accept either a bare int (r=id) or a dict {"r": id, "params": {...}}."""
    if isinstance(spec, int):
        return spec, {}
    return int(spec["r"]), dict(spec.get("params", {}))


@retry(stop=stop_after_attempt(4), wait=wait_exponential_jitter(initial=2, max=30))
def fetch_csv(registry: str, report_spec) -> bytes:
    """Full two-step fetch. Returns the CSV body as UTF-8 encoded bytes.

    The APX download endpoint streams CSV in Windows-1252 / latin-1 (no BOM,
    no charset header). Downstream consumers (Node.js readFileSync,
    generators, tooling) almost always default to UTF-8. If we write those
    raw bytes to disk, `0xED` ("í") / `0xE9` ("é") / `0xF1` ("ñ") etc. get
    mangled to replacement characters on read. We normalize to UTF-8 here
    so the on-disk files are safe for every downstream consumer.
    """
    host = REGISTRIES[registry]["host"]
    report_id, extra_params = _resolve_report(report_spec)
    from urllib.parse import urlencode
    qs = urlencode({"r": report_id, **extra_params})
    report_url = f"{host}/mymodule/rpt/myrpt.asp?{qs}"
    download_url = f"{host}/myModule/include/rptdownload.asp"

    with httpx.Client(
        headers=HEADERS,
        follow_redirects=True,
        timeout=httpx.Timeout(120.0, connect=20.0),
    ) as client:
        # Step 1: GET the report page (establishes session cookies +
        # emits the session-bound frmDownload form fields).
        r1 = client.get(report_url)
        r1.raise_for_status()
        html = r1.content.decode("latin-1", errors="replace")

        # Step 2: POST the download form with cookies carried over.
        data = extract_download_form(html)
        r2 = client.post(
            download_url,
            data=data,
            headers={**HEADERS, "Referer": report_url},
        )
        r2.raise_for_status()
        # Re-encode latin-1 → UTF-8 so readFileSync/utf-8-default callers work.
        return r2.content.decode("latin-1").encode("utf-8")


@click.group()
def cli():
    """ACR and CAR ingestors (APX Classic public reports)."""


@cli.command()
@click.option(
    "--registry",
    type=click.Choice(list(REGISTRIES.keys())),
    required=True,
)
@click.option("--report", default="projects", type=click.Choice(ALL_REPORT_KEYS))
@click.option(
    "--out",
    type=click.Path(path_type=Path),
    default=None,
    help="Default: data/<registry>/<report>.csv",
)
def download(registry: str, report: str, out: Optional[Path]):
    """Download a public report as CSV."""
    reports = REGISTRIES[registry]["reports"]
    if report not in reports:
        raise click.UsageError(
            f"{registry!r} does not expose report {report!r}. "
            f"Available: {list(reports)}"
        )
    spec = reports[report]
    rid, extra = _resolve_report(spec)
    if out is None:
        out = REGISTRIES[registry]["dir"] / f"{report}.csv"
    out.parent.mkdir(parents=True, exist_ok=True)

    click.echo(
        f"→ {REGISTRIES[registry]['name']}  report={report} (r={rid}"
        + (f" {extra}" if extra else "")
        + ")"
    )
    body = fetch_csv(registry, spec)
    out.write_bytes(body)
    newline = b"\n"
    click.echo(f"  wrote {out}  ({len(body):,} bytes, {body.count(newline)} lines)")


@cli.command()
@click.option(
    "--registry",
    type=click.Choice(list(REGISTRIES.keys())),
    required=True,
)
def download_all(registry: str):
    """Download every public report for this registry."""
    reports = REGISTRIES[registry]["reports"]
    click.echo(f"→ {REGISTRIES[registry]['name']}  ({len(reports)} reports)")
    for name, spec in reports.items():
        rid, extra = _resolve_report(spec)
        out = REGISTRIES[registry]["dir"] / f"{name}.csv"
        out.parent.mkdir(parents=True, exist_ok=True)
        try:
            body = fetch_csv(registry, spec)
            out.write_bytes(body)
            newline = b"\n"
            click.echo(
                f"  {name:<22s} r={rid}  {len(body):>10,} B  {body.count(newline):>7} lines  → {out}"
            )
        except Exception as e:
            click.echo(f"  {name:<22s} r={rid}  ✗ {type(e).__name__}: {e}")


@cli.command()
def probe():
    """Smoke test every registry with the projects report."""
    for reg in REGISTRIES:
        rid = REGISTRIES[reg]["reports"]["projects"]
        try:
            body = fetch_csv(reg, rid)
            newline = b"\n"
            click.echo(
                f"  {reg:5s} ✓  {len(body):,} bytes  {body.count(newline)} lines"
            )
        except Exception as e:
            click.echo(f"  {reg:5s} ✗  {type(e).__name__}: {e}")


if __name__ == "__main__":
    cli()
