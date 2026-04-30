"""
Generic Crawl4AI deep crawler for competitor analysis.
Usage: python3 crawl_site.py <start_url> <output_folder_name> [max_pages] [max_depth]
"""
import asyncio
import json
import os
import sys

from crawl4ai import (
    AsyncWebCrawler,
    BrowserConfig,
    CrawlerRunConfig,
    CacheMode,
    BFSDeepCrawlStrategy,
)


async def crawl(start_url: str, output_dir: str, max_pages: int, max_depth: int):
    os.makedirs(output_dir, exist_ok=True)

    browser_cfg = BrowserConfig(headless=True)
    crawl_cfg = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        deep_crawl_strategy=BFSDeepCrawlStrategy(
            max_depth=max_depth,
            max_pages=max_pages,
            include_external=False,
        ),
        exclude_external_links=True,
        word_count_threshold=30,
        page_timeout=30000,
        verbose=True,
    )

    results_summary = []

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        results = await crawler.arun(url=start_url, config=crawl_cfg)

        if not isinstance(results, list):
            results = [results]

        for i, result in enumerate(results):
            if not result.success:
                print(f"  SKIP (failed): {getattr(result, 'url', 'unknown')}")
                continue

            md = result.markdown or ""
            if len(md.strip()) < 50:
                continue

            safe_name = (
                result.url.replace("https://", "")
                .replace("http://", "")
                .replace("/", "_")
                .strip("_")
            )
            if len(safe_name) > 120:
                safe_name = safe_name[:120]
            filename = f"{i:03d}_{safe_name}.md"
            filepath = os.path.join(output_dir, filename)

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"# Source: {result.url}\n\n")
                f.write(md)

            results_summary.append({
                "url": result.url,
                "title": (result.metadata or {}).get("title", ""),
                "word_count": len(md.split()),
                "file": filename,
            })
            print(f"  Saved: {filename} ({len(md.split())} words)")

    summary_path = os.path.join(output_dir, "_index.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "start_url": start_url,
                "pages_crawled": len(results_summary),
                "pages": results_summary,
            },
            f,
            indent=2,
        )

    print(f"\nDone: {len(results_summary)} pages saved to {output_dir}")


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 crawl_site.py <start_url> <output_folder> [max_pages] [max_depth]")
        sys.exit(1)

    start_url = sys.argv[1]
    output_dir = sys.argv[2]
    max_pages = int(sys.argv[3]) if len(sys.argv) > 3 else 60
    max_depth = int(sys.argv[4]) if len(sys.argv) > 4 else 3

    asyncio.run(crawl(start_url, output_dir, max_pages, max_depth))


if __name__ == "__main__":
    main()
