import time
import requests
from datetime import datetime, timezone

CHAIN_ID = "solana"

MAX_LIQUIDITY_USD = 10_000
MIN_AGE_DAYS = 3
MAX_VOLUME_24H = 10_000
MAX_TXNS_24H = 80
MIN_PRICE_DROP_24H = -50

SEARCH_TERMS = [
    "pump", "moon", "dog", "cat", "pepe", "inu", "ai", "sol",
    "cto", "community", "meme", "coin", "baby", "trump", "elon",
    "frog", "bear", "bull", "chad", "wife", "mascot"
]

SEARCH_URL = "https://api.dexscreener.com/latest/dex/search?q={query}"
TOKEN_PROFILE_URL = "https://api.dexscreener.com/token-profiles/latest/v1"

HEADERS = {
    "User-Agent": "GnomeDeadCommunityFinder/1.0"
}


def get_json(url):
    response = requests.get(url, headers=HEADERS, timeout=20)
    response.raise_for_status()
    return response.json()


def safe_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def pair_age_days(pair):
    created_at_ms = pair.get("pairCreatedAt")
    if not created_at_ms:
        return None

    created = datetime.fromtimestamp(created_at_ms / 1000, tz=timezone.utc)
    now = datetime.now(timezone.utc)
    return (now - created).days


def total_txns_24h(pair):
    txns = pair.get("txns", {}).get("h24", {})
    buys = int(txns.get("buys") or 0)
    sells = int(txns.get("sells") or 0)
    return buys + sells


def looks_dead_or_rug_like(pair):
    liquidity = safe_float((pair.get("liquidity") or {}).get("usd"))
    volume_24h = safe_float((pair.get("volume") or {}).get("h24"))
    price_change_24h = safe_float((pair.get("priceChange") or {}).get("h24"))
    age = pair_age_days(pair)
    txns_24h = total_txns_24h(pair)

    if age is None or age < MIN_AGE_DAYS:
        return False

    if liquidity > MAX_LIQUIDITY_USD:
        return False

    # rug/dead-like signals
    very_low_liq = liquidity <= 2_000
    low_activity = volume_24h <= MAX_VOLUME_24H or txns_24h <= MAX_TXNS_24H
    big_drop = price_change_24h <= MIN_PRICE_DROP_24H

    return very_low_liq or low_activity or big_drop


def collect_profiles_socials():
    """
    Dexscreener latest profiles contains links/socials, but only for latest profiles.
    We use it as a social lookup map when available.
    """
    social_map = {}

    try:
        profiles = get_json(TOKEN_PROFILE_URL)
    except Exception as exc:
        print(f"Could not fetch token profiles: {exc}")
        return social_map

    if not isinstance(profiles, list):
        return social_map

    for profile in profiles:
        chain_id = profile.get("chainId")
        token_address = profile.get("tokenAddress")
        if chain_id != CHAIN_ID or not token_address:
            continue

        links = []
        for link in profile.get("links") or []:
            url = link.get("url")
            if not url:
                continue

            low = url.lower()
            if (
                "t.me/" in low
                or "telegram" in low
                or "x.com/" in low
                or "twitter.com/" in low
                or "discord" in low
            ):
                links.append(url)

        if links:
            social_map[token_address] = list(dict.fromkeys(links))

    return social_map


def extract_socials_from_pair(pair):
    """
    Sometimes pair info contains info/websites/socials.
    Structure can vary, so this is defensive.
    """
    socials = []

    info = pair.get("info") or {}

    for website in info.get("websites") or []:
        url = website.get("url")
        if url:
            socials.append(url)

    for social in info.get("socials") or []:
        url = social.get("url")
        if url:
            socials.append(url)

    return list(dict.fromkeys(socials))


def main():
    social_map = collect_profiles_socials()
    seen_pairs = set()
    found = 0

    for term in SEARCH_TERMS:
        print(f"\nSearching: {term}")

        try:
            data = get_json(SEARCH_URL.format(query=term))
        except Exception as exc:
            print(f"Search failed for {term}: {exc}")
            continue

        pairs = data.get("pairs") or []

        for pair in pairs:
            if pair.get("chainId") != CHAIN_ID:
                continue

            pair_address = pair.get("pairAddress")
            if not pair_address or pair_address in seen_pairs:
                continue
            seen_pairs.add(pair_address)

            base = pair.get("baseToken") or {}
            token_address = base.get("address")
            symbol = base.get("symbol") or "UNKNOWN"

            if not token_address:
                continue

            if not looks_dead_or_rug_like(pair):
                continue

            socials = extract_socials_from_pair(pair)

            # fallback to latest profile social map if available
            if not socials:
                socials = social_map.get(token_address, [])

            if not socials:
                continue

            found += 1

            liquidity = safe_float((pair.get("liquidity") or {}).get("usd"))
            volume_24h = safe_float((pair.get("volume") or {}).get("h24"))
            price_change_24h = safe_float((pair.get("priceChange") or {}).get("h24"))
            age_days = pair_age_days(pair)
            txns_24h = total_txns_24h(pair)

            print("\n" + "=" * 90)
            print(f"{found}. {symbol}")
            print(f"Age: {age_days} days")
            print(f"Liquidity: ${liquidity:,.0f}")
            print(f"24h Volume: ${volume_24h:,.0f}")
            print(f"24h Change: {price_change_24h:.2f}%")
            print(f"24h Txns: {txns_24h}")
            print(f"Dexscreener: {pair.get('url', '')}")
            print("Socials:")
            for social in socials:
                print(f"- {social}")

        time.sleep(0.5)

    print("\nDone.")
    print(f"Found {found} candidates with low liquidity / old age / socials.")


if __name__ == "__main__":
    main()