#!/usr/bin/env python3
"""
scrape_linkedin_jobs.py — Fetch ICS/OT cybersecurity jobs from LinkedIn's
public guest search and write them into src/jobs/jobs.xlsx in the exact
format the ArmorInnovate app expects.

Usage:
    pip install requests beautifulsoup4 openpyxl
    python scripts/scrape_linkedin_jobs.py

The script:
  1. Hits LinkedIn's public guest job search API (no auth needed)
  2. Searches for ICS/OT/cybersecurity keywords, India-focused
  3. Parses each listing for title, company, location, date, URL
  4. Fetches individual job pages for description details
  5. Auto-categorises into profiles (ics_ot_security, scada_engineer, etc.)
  6. Writes the result to src/jobs/jobs.xlsx

LinkedIn rate-limits aggressively. The script adds random delays between
requests. If you get blocked, wait a few minutes and re-run — it resumes
from where it left off (deduplicates by URL).
"""

import os
import re
import sys
import time
import random
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup
from openpyxl import Workbook, load_workbook

# ─────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "src" / "jobs" / "jobs.xlsx"

# Search queries — each is (keywords, location, profile_hint)
SEARCHES = [
    # India-focused ICS/OT
    ("ICS OT security", "India", "ics_ot_security"),
    ("SCADA security", "India", "scada_engineer"),
    ("industrial cybersecurity", "India", "ics_ot_security"),
    ("ICS penetration testing", "India", "pentesting"),
    ("OT security engineer", "India", "ics_ot_security"),
    ("IEC 62443", "India", "compliance_grc"),
    ("SCADA engineer", "India", "scada_engineer"),
    ("cyber threat intelligence OT", "India", "threat_intel"),
    ("critical infrastructure security", "India", "ics_ot_security"),
    ("industrial control system security", "India", "ics_ot_security"),
    ("OT network security", "India", "ics_ot_security"),
    ("PLC security", "India", "scada_engineer"),
    ("cybersecurity GRC", "India", "compliance_grc"),
    ("cybersecurity compliance", "India", "compliance_grc"),
    ("red team OT", "India", "pentesting"),
    ("cyber security analyst", "India", "ics_ot_security"),
    ("network security engineer", "India", "ics_ot_security"),
    ("SOC analyst", "India", "threat_intel"),
    ("penetration tester", "India", "pentesting"),
    ("vulnerability assessment", "India", "pentesting"),
    # Broader / overseas (smaller set, high-signal queries only)
    ("ICS OT security", "United States", "ics_ot_security"),
    ("SCADA cybersecurity", "United Kingdom", "scada_engineer"),
    ("ICS security engineer", "Germany", "ics_ot_security"),
    ("OT cybersecurity", "United Arab Emirates", "ics_ot_security"),
    ("industrial cybersecurity", "Singapore", "ics_ot_security"),
    ("ICS penetration testing", "Australia", "pentesting"),
    ("IEC 62443", "Europe", "compliance_grc"),
]

# Max pages to scrape per search query (25 jobs per page)
MAX_PAGES_PER_SEARCH = 4  # = up to 100 jobs per query

# Headers to mimic a real browser
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# Profile classification keywords
PROFILE_KEYWORDS = {
    "pentesting": [
        "penetration test", "pentest", "red team", "offensive security",
        "vulnerability assessment", "ethical hack", "bug bounty",
    ],
    "scada_engineer": [
        "scada", "plc", "hmi", "dcs", "rtu", "industrial automation",
        "control system engineer", "automation engineer",
    ],
    "threat_intel": [
        "threat intelligence", "threat hunting", "soc analyst",
        "incident response", "forensic", "malware analyst", "siem",
        "security operations center",
    ],
    "compliance_grc": [
        "grc", "governance risk compliance", "iec 62443", "nist",
        "iso 27001", "compliance", "audit", "risk assessment",
        "nerc cip", "regulatory",
    ],
    "ics_ot_security": [
        "ics", "ot security", "industrial cyber", "operational technology",
        "critical infrastructure", "iiot", "industrial internet",
        "ot network", "industrial control",
    ],
}

# Excel column order — must match what src/lib/jobs.ts expects
COLUMNS = [
    "Date Posted",
    "Profile",
    "Title",
    "Company",
    "Company Type",
    "Location",
    "Job Type",
    "Job Level",
    "Remote",
    "Experience",
    "Role Summary",
    "Skills Required",
    "Domain Context",
    "Relevance",
    "Job URL",
]


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

def sleep_random(lo: float = 1.5, hi: float = 4.0):
    """Random delay to avoid rate limiting."""
    time.sleep(random.uniform(lo, hi))


def classify_profile(title: str, description: str, hint: str) -> str:
    """Classify a job into a profile category based on title + description."""
    text = (title + " " + description).lower()
    scores: dict[str, int] = {}
    for profile, keywords in PROFILE_KEYWORDS.items():
        scores[profile] = sum(1 for kw in keywords if kw in text)
    best = max(scores, key=lambda k: scores[k])
    if scores[best] > 0:
        return best
    return hint  # fallback to the search query's hint


def guess_company_type(company: str) -> str:
    """Rough heuristic for company type."""
    c = company.lower()
    consulting = ["deloitte", "kpmg", "pwc", "ey ", "ernst", "accenture",
                   "mckinsey", "bain", "bcg", "capgemini", "infosys",
                   "wipro", "tcs", "cognizant", "hcl", "tech mahindra"]
    product = ["siemens", "honeywell", "schneider", "abb", "rockwell",
               "fortinet", "palo alto", "cisco", "dragos", "nozomi",
               "claroty", "tenable", "crowdstrike", "mandiant"]
    govt = ["government", "ministry", "defence", "drdo", "isro", "ntpc",
            "ongc", "bhel", "cert-in", "nciipc"]
    for kw in consulting:
        if kw in c:
            return "Consulting"
    for kw in product:
        if kw in c:
            return "Product / Vendor"
    for kw in govt:
        if kw in c:
            return "Government / PSU"
    return "Corporate"


def guess_job_level(title: str) -> str:
    t = title.lower()
    if any(x in t for x in ["senior", "sr.", "lead", "principal", "staff"]):
        return "Senior"
    if any(x in t for x in ["manager", "director", "head", "vp", "chief"]):
        return "Manager+"
    if any(x in t for x in ["junior", "jr.", "intern", "trainee", "entry"]):
        return "Entry"
    return "Mid"


def guess_remote(location: str) -> bool:
    loc = (location or "").lower()
    return "remote" in loc


def compute_relevance(title: str, description: str) -> int:
    """Score 0-100 based on how ICS/OT-relevant the listing is."""
    text = (title + " " + description).lower()
    high_signal = [
        "ics", "ot security", "scada", "plc", "iec 62443", "nist 800-82",
        "industrial control", "operational technology", "critical infrastructure",
        "hmi", "dcs", "modbus", "dnp3", "s7comm", "opc ua",
    ]
    medium_signal = [
        "cybersecurity", "penetration test", "pentest", "red team",
        "threat intelligence", "soc", "incident response", "grc",
        "network security", "vulnerability", "compliance",
    ]
    score = 0
    for kw in high_signal:
        if kw in text:
            score += 8
    for kw in medium_signal:
        if kw in text:
            score += 3
    return min(100, max(5, score))


def parse_relative_date(text: str) -> Optional[str]:
    """Convert LinkedIn's relative dates like '2 days ago' to ISO date."""
    if not text:
        return None
    text = text.strip().lower()
    today = datetime.now()
    if "just now" in text or "today" in text:
        return today.strftime("%Y-%m-%d")
    m = re.search(r"(\d+)\s*(hour|day|week|month)", text)
    if m:
        n = int(m.group(1))
        unit = m.group(2)
        if unit == "hour":
            return today.strftime("%Y-%m-%d")
        elif unit == "day":
            return (today - timedelta(days=n)).strftime("%Y-%m-%d")
        elif unit == "week":
            return (today - timedelta(weeks=n)).strftime("%Y-%m-%d")
        elif unit == "month":
            return (today - timedelta(days=n * 30)).strftime("%Y-%m-%d")
    return None


# ─────────────────────────────────────────────────────────────────────
# LinkedIn scraping
# ─────────────────────────────────────────────────────────────────────

def fetch_search_page(keywords: str, location: str, start: int = 0) -> list[dict]:
    """Fetch one page of LinkedIn guest job search results."""
    url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    params = {
        "keywords": keywords,
        "location": location,
        "start": start,
        "f_TPR": "r604800",  # past week
        "sortBy": "R",       # relevance
    }
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=15)
        if resp.status_code == 429:
            print(f"  ⚠ Rate limited. Waiting 60s...")
            time.sleep(60)
            resp = requests.get(url, params=params, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            print(f"  ⚠ Got status {resp.status_code} for '{keywords}' in {location}")
            return []
    except requests.RequestException as e:
        print(f"  ⚠ Request failed: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    cards = soup.find_all("li")
    results = []

    for card in cards:
        try:
            title_el = card.find("h3", class_="base-search-card__title")
            company_el = card.find("h4", class_="base-search-card__subtitle")
            location_el = card.find("span", class_="job-search-card__location")
            date_el = card.find("time")
            link_el = card.find("a", class_="base-card__full-link")

            if not title_el or not link_el:
                continue

            title = title_el.get_text(strip=True)
            company = company_el.get_text(strip=True) if company_el else "Unknown"
            loc = location_el.get_text(strip=True) if location_el else location
            date_text = date_el.get("datetime", "") if date_el else ""
            if not date_text and date_el:
                date_text = date_el.get_text(strip=True)
            job_url = link_el.get("href", "").split("?")[0]  # clean URL

            if not job_url:
                continue

            results.append({
                "title": title,
                "company": company,
                "location": loc,
                "date_posted": date_text if date_text and "-" in date_text
                    else parse_relative_date(date_text),
                "job_url": job_url,
            })
        except Exception:
            continue

    return results


def fetch_job_detail(job_url: str) -> dict:
    """Fetch the full job description from a LinkedIn job page."""
    try:
        resp = requests.get(job_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return {}
    except requests.RequestException:
        return {}

    soup = BeautifulSoup(resp.text, "html.parser")
    detail = {}

    # Description
    desc_el = soup.find("div", class_="show-more-less-html__markup")
    if desc_el:
        detail["description"] = desc_el.get_text(separator="\n", strip=True)
    else:
        detail["description"] = ""

    # Criteria list (seniority, employment type, etc.)
    criteria = soup.find_all("li", class_="description__job-criteria-item")
    for item in criteria:
        header = item.find("h3")
        value = item.find("span")
        if header and value:
            key = header.get_text(strip=True).lower()
            val = value.get_text(strip=True)
            if "seniority" in key:
                detail["seniority"] = val
            elif "employment" in key:
                detail["job_type"] = val
            elif "function" in key:
                detail["function"] = val
            elif "industries" in key or "industry" in key:
                detail["industry"] = val

    return detail


def extract_skills(description: str) -> str:
    """Pull out skills from a job description."""
    skills_keywords = [
        "ICS", "OT", "SCADA", "PLC", "HMI", "DCS", "RTU",
        "IEC 62443", "NIST 800-82", "NERC CIP", "ISA/IEC",
        "Modbus", "DNP3", "OPC UA", "OPC DA", "S7comm", "EtherNet/IP",
        "BACnet", "PROFINET", "HART",
        "Firewall", "IDS", "IPS", "SIEM", "SOAR",
        "Nessus", "Wireshark", "Metasploit", "Nmap", "Burp Suite",
        "Python", "PowerShell", "Bash", "Linux", "Windows",
        "TCP/IP", "VPN", "VLAN", "network segmentation",
        "ISO 27001", "SOC 2", "GDPR", "risk assessment",
        "incident response", "forensics", "malware analysis",
        "threat hunting", "vulnerability management",
        "Fortinet", "Palo Alto", "Cisco", "Claroty", "Dragos", "Nozomi",
        "CrowdStrike", "Splunk", "QRadar", "Microsoft Sentinel",
        "Active Directory", "Zero Trust", "PAM",
        "CI/CD", "DevSecOps", "cloud security", "AWS", "Azure", "GCP",
    ]
    desc_lower = description.lower()
    found = [s for s in skills_keywords if s.lower() in desc_lower]
    return ", ".join(found) if found else ""


def extract_domain_context(description: str) -> str:
    """Extract domain/industry context from description."""
    domains = [
        "energy", "oil and gas", "oil & gas", "power generation",
        "manufacturing", "automotive", "pharmaceutical", "chemical",
        "water treatment", "utilities", "transportation", "rail",
        "defense", "defence", "aerospace", "nuclear", "mining",
        "smart grid", "renewable", "solar", "wind energy",
        "building automation", "smart building", "data center",
        "telecom", "healthcare", "food and beverage",
        "critical infrastructure", "government",
    ]
    desc_lower = description.lower()
    found = [d.title() for d in domains if d in desc_lower]
    return ", ".join(found[:5]) if found else ""


def extract_experience(description: str, seniority: str = "") -> str:
    """Try to extract years of experience required."""
    m = re.search(r"(\d+)\+?\s*(?:to\s*(\d+))?\s*years?\s*(?:of\s+)?(?:experience|exp)", description, re.I)
    if m:
        lo = m.group(1)
        hi = m.group(2)
        if hi:
            return f"{lo}–{hi} years"
        return f"{lo}+ years"
    if seniority:
        mapping = {
            "Entry level": "0–2 years",
            "Associate": "2–4 years",
            "Mid-Senior level": "5–8 years",
            "Director": "10+ years",
            "Executive": "15+ years",
        }
        return mapping.get(seniority, "")
    return ""


def extract_role_summary(description: str) -> str:
    """Extract first ~3 sentences as a role summary."""
    lines = [l.strip() for l in description.split("\n") if l.strip()]
    summary_lines = []
    char_count = 0
    for line in lines:
        if char_count > 500:
            break
        # Skip short header-like lines
        if len(line) < 20 and not line.endswith("."):
            continue
        summary_lines.append(line)
        char_count += len(line)
    return " ".join(summary_lines[:5])[:600]


# ─────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("ArmorInnovate — LinkedIn ICS/OT Job Scraper")
    print("=" * 60)

    # Load existing jobs to avoid duplicates
    existing_urls: set[str] = set()
    existing_jobs: list[dict] = []

    if OUTPUT_PATH.exists():
        wb = load_workbook(OUTPUT_PATH)
        ws = wb.active
        if ws and ws.max_row and ws.max_row > 1:
            headers = [cell.value for cell in ws[1]]
            url_idx = headers.index("Job URL") if "Job URL" in headers else -1
            if url_idx >= 0:
                for row in ws.iter_rows(min_row=2, values_only=True):
                    row_dict = dict(zip(headers, row))
                    existing_jobs.append(row_dict)
                    if row[url_idx]:
                        existing_urls.add(str(row[url_idx]).split("?")[0])
        print(f"✓ Loaded {len(existing_jobs)} existing jobs from {OUTPUT_PATH.name}")
    else:
        print("  No existing jobs.xlsx found — starting fresh.")

    # Scrape
    new_jobs: list[dict] = []
    seen_urls: set[str] = set(existing_urls)

    for i, (keywords, location, profile_hint) in enumerate(SEARCHES, 1):
        print(f"\n[{i}/{len(SEARCHES)}] Searching: '{keywords}' in {location}")

        for page in range(MAX_PAGES_PER_SEARCH):
            start = page * 25
            print(f"  Page {page + 1} (start={start})...", end=" ", flush=True)

            listings = fetch_search_page(keywords, location, start)
            if not listings:
                print("0 results — moving on.")
                break

            added = 0
            for listing in listings:
                clean_url = listing["job_url"].split("?")[0]
                if clean_url in seen_urls:
                    continue
                seen_urls.add(clean_url)

                # Fetch detail page
                sleep_random(1.0, 2.5)
                detail = fetch_job_detail(listing["job_url"])
                desc = detail.get("description", "")

                job = {
                    "Date Posted": listing["date_posted"],
                    "Profile": classify_profile(
                        listing["title"], desc, profile_hint
                    ),
                    "Title": listing["title"],
                    "Company": listing["company"],
                    "Company Type": guess_company_type(listing["company"]),
                    "Location": listing["location"],
                    "Job Type": detail.get("job_type", "Full-time"),
                    "Job Level": detail.get("seniority", guess_job_level(listing["title"])),
                    "Remote": guess_remote(listing["location"]),
                    "Experience": extract_experience(desc, detail.get("seniority", "")),
                    "Role Summary": extract_role_summary(desc),
                    "Skills Required": extract_skills(desc),
                    "Domain Context": extract_domain_context(desc),
                    "Relevance": compute_relevance(listing["title"], desc),
                    "Job URL": clean_url,
                }
                new_jobs.append(job)
                added += 1

            print(f"{len(listings)} found, {added} new.")
            sleep_random(2.0, 4.5)

            if len(listings) < 20:
                break  # no more pages

    print(f"\n{'=' * 60}")
    print(f"Scraped {len(new_jobs)} new jobs.")

    # Merge with existing
    all_jobs = existing_jobs + new_jobs
    print(f"Total jobs (existing + new): {len(all_jobs)}")

    # Write to Excel
    wb = Workbook()
    ws = wb.active
    ws.title = "Jobs"

    # Header row
    for col_idx, col_name in enumerate(COLUMNS, 1):
        cell = ws.cell(row=1, column=col_idx, value=col_name)
        cell.font = cell.font.copy(bold=True)

    # Data rows
    for row_idx, job in enumerate(all_jobs, 2):
        for col_idx, col_name in enumerate(COLUMNS, 1):
            value = job.get(col_name, "")
            if col_name == "Remote":
                value = bool(value) if not isinstance(value, bool) else value
            if col_name == "Relevance":
                value = int(value) if value else 0
            ws.cell(row=row_idx, column=col_idx, value=value)

    # Auto-width columns
    for col_idx, col_name in enumerate(COLUMNS, 1):
        ws.column_dimensions[ws.cell(row=1, column=col_idx).column_letter].width = (
            max(len(col_name) + 2, 15)
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUTPUT_PATH)
    print(f"\n✓ Saved {len(all_jobs)} jobs to {OUTPUT_PATH}")
    print("  Restart the dev server or deploy to see changes on /jobs")

    # Stats
    profiles = {}
    locations = {}
    for j in all_jobs:
        p = j.get("Profile", "unknown")
        profiles[p] = profiles.get(p, 0) + 1
        loc = j.get("Location", "Unknown")
        # Rough country extraction
        parts = str(loc).split(",")
        country = parts[-1].strip() if parts else "Unknown"
        locations[country] = locations.get(country, 0) + 1

    print(f"\n📊 Profile breakdown:")
    for p, c in sorted(profiles.items(), key=lambda x: -x[1]):
        print(f"   {p}: {c}")
    print(f"\n🌍 Top locations:")
    for loc, c in sorted(locations.items(), key=lambda x: -x[1])[:10]:
        print(f"   {loc}: {c}")


if __name__ == "__main__":
    main()
