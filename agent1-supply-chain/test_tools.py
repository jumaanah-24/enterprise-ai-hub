"""
Temporary test script for supply_tools.py
Run from: agent1-supply-chain/
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from tools.supply_tools import (
    get_sku_details,
    calculate_inventory_gap,
    analyze_supplier,
    analyze_logistics,
    calculate_supply_risk,
    find_risky_skus,
)

DIVIDER = "-" * 60

def show(title: str, data):
    print(f"\n{DIVIDER}")
    print(f"  {title}")
    print(DIVIDER)
    print(json.dumps(data, indent=2, default=str))

if __name__ == "__main__":
    sku = "SKU2"

    show("get_sku_details(SKU2)",          get_sku_details(sku))
    show("calculate_inventory_gap(SKU2)",  calculate_inventory_gap(sku))
    show("analyze_supplier(SKU2)",         analyze_supplier(sku))
    show("analyze_logistics(SKU2)",        analyze_logistics(sku))
    show("calculate_supply_risk(SKU2)",    calculate_supply_risk(sku))
    show("find_risky_skus(10)",            find_risky_skus(10))

    print(f"\n{DIVIDER}")
    print("  All tests completed successfully.")
    print(DIVIDER)
