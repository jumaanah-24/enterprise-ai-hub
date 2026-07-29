/**
 * Prisma seed script — populates static tables from CSV data.
 * Run: node prisma/seed.js
 */

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    // handle commas inside quoted fields
    const values = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { values.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function f(v) { return v === "" || v == null ? null : parseFloat(v); }
function n(v) { return v === "" || v == null ? null : parseInt(v, 10); }
function b(v) { return String(v).trim().toLowerCase() === "true"; }

async function main() {
  // supply_chain
  if ((await prisma.supplyChain.count()) === 0) {
    const rows = parseCSV(path.join(ROOT, "agent1-supply-chain/data/supply_chain_data.csv"));
    await prisma.supplyChain.createMany({
      data: rows.map((r) => ({
        productType: r["Product type"],
        sku: r["SKU"],
        price: f(r["Price"]),
        availability: n(r["Availability"]),
        productsSold: n(r["Number of products sold"]),
        revenueGenerated: f(r["Revenue generated"]),
        customerDemographics: r["Customer demographics"],
        stockLevels: n(r["Stock levels"]),
        leadTimes: n(r["Lead times"]),
        orderQuantities: n(r["Order quantities"]),
        shippingTimes: n(r["Shipping times"]),
        shippingCarriers: r["Shipping carriers"],
        shippingCosts: f(r["Shipping costs"]),
        supplierName: r["Supplier name"],
        location: r["Location"],
        leadTime: n(r["Lead time"]),
        productionVolumes: n(r["Production volumes"]),
        manufacturingLeadTime: n(r["Manufacturing lead time"]),
        manufacturingCosts: f(r["Manufacturing costs"]),
        inspectionResults: r["Inspection results"],
        defectRates: f(r["Defect rates"]),
        transportationModes: r["Transportation modes"],
        routes: r["Routes"],
        costs: f(r["Costs"]),
      })),
    });
    console.log("Seeded: supply_chain");
  }

  // budgets
  if ((await prisma.budget.count()) === 0) {
    const rows = parseCSV(path.join(ROOT, "agent2-budget-finance/data/budgets.csv"));
    await prisma.budget.createMany({
      data: rows.map((r) => ({
        department: r["department"],
        allocatedBudget: f(r["allocated_budget"]),
        spentBudget: f(r["spent_budget"]),
        fiscalYear: n(r["fiscal_year"]),
        category: r["category"],
      })),
    });
    console.log("Seeded: budgets");
  }

  // procurement
  if ((await prisma.procurement.count()) === 0) {
    const rows = parseCSV(path.join(ROOT, "agent2-budget-finance/data/procurement.csv"));
    await prisma.procurement.createMany({
      data: rows.map((r) => ({
        purchaseId: r["purchase_id"],
        department: r["department"],
        vendor: r["vendor"],
        item: r["item"],
        amount: f(r["amount"]),
        date: r["date"],
        status: r["status"],
        category: r["category"],
      })),
    });
    console.log("Seeded: procurement");
  }

  // expenses
  const expPath = path.join(ROOT, "agent2-budget-finance/data/expenses.csv");
  if (fs.existsSync(expPath) && (await prisma.expense.count()) === 0) {
    const rows = parseCSV(expPath);
    await prisma.expense.createMany({
      data: rows.map((r) => ({
        department: r["department"],
        category: r["category"],
        amount: f(r["amount"]),
        approved: b(r["approved"]),
        date: r["date"] ?? "",
      })),
    });
    console.log("Seeded: expenses");
  }

  // cloud_costs
  const ccPath = path.join(ROOT, "agent2-budget-finance/data/cloud_costs.csv");
  if (fs.existsSync(ccPath) && (await prisma.cloudCost.count()) === 0) {
    const rows = parseCSV(ccPath);
    await prisma.cloudCost.createMany({
      data: rows.map((r) => ({
        month: r["month"],
        totalCost: f(r["total_cost"]),
        budgetLimit: f(r["budget_limit"]),
      })),
    });
    console.log("Seeded: cloud_costs");
  }

  // contracts
  if ((await prisma.contract.count()) === 0) {
    const rows = parseCSV(path.join(ROOT, "agent3-vendor-contract/data/contracts.csv"));
    await prisma.contract.createMany({
      data: rows.map((r) => ({
        contractId: r["contract_id"],
        vendor: r["vendor"],
        department: r["department"],
        startDate: r["start_date"],
        endDate: r["end_date"],
        value: f(r["value"]),
        paymentTerms: r["payment_terms"],
        slaUptime: f(r["sla_uptime"]),
        slaResponseHours: n(r["sla_response_hours"]),
        penaltyClause: r["penalty_clause"],
        status: r["status"],
        category: r["category"],
        autoRenew: b(r["auto_renew"]),
      })),
    });
    console.log("Seeded: contracts");
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
