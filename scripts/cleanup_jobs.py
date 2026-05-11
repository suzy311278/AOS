#!/usr/bin/env python3
"""Remove all non-cybersecurity jobs from jobs.xlsx."""

from openpyxl import load_workbook, Workbook
from pathlib import Path

xlsx = Path(__file__).resolve().parent.parent / "src" / "jobs" / "jobs.xlsx"
wb = load_workbook(xlsx)
ws = wb.active
headers = [c.value for c in ws[1]]

# Profiles that are clearly cybersecurity — keep these
CYBER_PROFILES = {
    "ics_ot_security", "scada_engineer", "threat_intel",
    "pentesting", "compliance_grc",
}

# ESG/sustainability profiles — remove these
ESG_PROFILES = {
    "climate_risk", "general_esg", "clean_energy_adjacent",
    "sustainable_finance", "carbon_markets", "eu_taxonomy_sfdr",
}

# Keywords to rescue ambiguous/None-profile rows
CYBER_KW = [
    "cyber", "security", "ics", "scada", "plc", "hmi", "pentest",
    "penetration", "soc ", "siem", "threat", "malware", "firewall",
    "vulnerability", "incident response", "forensic", "grc",
    "iec 62443", "nist", "iso 27001", "red team", "blue team",
    "network security", "infosec", "information security",
    "dcs", "rtu", "modbus", "dnp3", "opc ua", "s7comm",
    "ot security", "operational technology", "critical infrastructure",
]

profile_idx = headers.index("Profile")
title_idx = headers.index("Title")
summary_idx = headers.index("Role Summary") if "Role Summary" in headers else -1
skills_idx = headers.index("Skills Required") if "Skills Required" in headers else -1

keep = []
removed = 0

for row in ws.iter_rows(min_row=2, values_only=True):
    profile = str(row[profile_idx] or "").strip()

    if profile in CYBER_PROFILES:
        keep.append(list(row))
        continue

    if profile in ESG_PROFILES:
        removed += 1
        continue

    # For None/unknown profiles, check content for cyber keywords
    text = " ".join([
        str(row[title_idx] or ""),
        str(row[summary_idx] or "") if summary_idx >= 0 else "",
        str(row[skills_idx] or "") if skills_idx >= 0 else "",
    ]).lower()

    if any(kw in text for kw in CYBER_KW):
        keep.append(list(row))
    else:
        removed += 1

print(f"Removed {removed} non-cybersecurity jobs")
print(f"Keeping {len(keep)} cybersecurity jobs")

# Profile breakdown of what's left
from collections import Counter
profiles = Counter(str(r[profile_idx] or "unknown") for r in keep)
print("\nProfile breakdown:")
for p, c in profiles.most_common():
    print(f"  {p}: {c}")

# Write clean file
wb2 = Workbook()
ws2 = wb2.active
ws2.title = "Jobs"
for ci, h in enumerate(headers, 1):
    ws2.cell(row=1, column=ci, value=h)
for ri, row_data in enumerate(keep, 2):
    for ci, val in enumerate(row_data, 1):
        ws2.cell(row=ri, column=ci, value=val)

wb2.save(xlsx)
print(f"\nSaved {len(keep)} jobs to {xlsx}")
