"""Adapter: re-exports agent3 contract tools for the orchestrator."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "agent3-vendor-contract"))
from tools.contract_tools import (
    search_policy,
    get_contract_details,
    check_vendor_compliance,
    get_sla_terms,
    get_payment_terms,
    check_vendor_eligibility,
    get_expiring_contracts,
    get_vendor_summary,
)
