import sys, traceback
sys.stdout.reconfigure(line_buffering=True)

print("=== Pipeline Test ===")
try:
    from crew import run_pipeline, Incident
    print("Import OK")
    print("Running pipeline...")
    result = run_pipeline(Incident(incident_id="INC001", sku="SKU2", required_quantity=88))
    print("SUCCESS:", result.get("pipeline"))
    print("Agent1:", str(result.get("agent1_supply_chain",""))[:200])
except Exception as e:
    print("FAILED:", str(e))
    traceback.print_exc()
