-- CreateTable
CREATE TABLE "supply_chain" (
    "id" SERIAL NOT NULL,
    "product_type" VARCHAR(50),
    "sku" VARCHAR(20) NOT NULL,
    "price" DOUBLE PRECISION,
    "availability" INTEGER,
    "products_sold" INTEGER,
    "revenue_generated" DOUBLE PRECISION,
    "customer_demographics" VARCHAR(50),
    "stock_levels" INTEGER,
    "lead_times" INTEGER,
    "order_quantities" INTEGER,
    "shipping_times" INTEGER,
    "shipping_carriers" VARCHAR(50),
    "shipping_costs" DOUBLE PRECISION,
    "supplier_name" VARCHAR(50),
    "location" VARCHAR(50),
    "lead_time" INTEGER,
    "production_volumes" INTEGER,
    "manufacturing_lead_time" INTEGER,
    "manufacturing_costs" DOUBLE PRECISION,
    "inspection_results" VARCHAR(20),
    "defect_rates" DOUBLE PRECISION,
    "transportation_modes" VARCHAR(30),
    "routes" VARCHAR(20),
    "costs" DOUBLE PRECISION,

    CONSTRAINT "supply_chain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" SERIAL NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "allocated_budget" DOUBLE PRECISION NOT NULL,
    "spent_budget" DOUBLE PRECISION NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "category" VARCHAR(50),

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement" (
    "id" SERIAL NOT NULL,
    "purchase_id" VARCHAR(20) NOT NULL,
    "department" VARCHAR(100),
    "vendor" VARCHAR(100),
    "item" VARCHAR(200),
    "amount" DOUBLE PRECISION,
    "date" VARCHAR(20),
    "status" VARCHAR(20),
    "category" VARCHAR(50),

    CONSTRAINT "procurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "department" VARCHAR(100),
    "category" VARCHAR(50),
    "amount" DOUBLE PRECISION,
    "approved" BOOLEAN,
    "date" VARCHAR(20),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud_costs" (
    "id" SERIAL NOT NULL,
    "month" VARCHAR(20) NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "budget_limit" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "cloud_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "contract_id" VARCHAR(20) NOT NULL,
    "vendor" VARCHAR(100),
    "department" VARCHAR(100),
    "start_date" VARCHAR(20),
    "end_date" VARCHAR(20),
    "value" DOUBLE PRECISION,
    "payment_terms" VARCHAR(50),
    "sla_uptime" DOUBLE PRECISION,
    "sla_response_hours" INTEGER,
    "penalty_clause" VARCHAR(200),
    "status" VARCHAR(20),
    "category" VARCHAR(50),
    "auto_renew" BOOLEAN,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_runs" (
    "id" SERIAL NOT NULL,
    "run_id" VARCHAR(20) NOT NULL,
    "incident_id" VARCHAR(50),
    "sku" VARCHAR(20),
    "required_qty" INTEGER,
    "status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" SERIAL NOT NULL,
    "run_id" VARCHAR(20) NOT NULL,
    "incident_id" VARCHAR(50),
    "sku" VARCHAR(20),
    "overall_risk" VARCHAR(20),
    "risk_score" DOUBLE PRECISION,
    "recommended_supplier" VARCHAR(100),
    "estimated_cost" DOUBLE PRECISION,
    "expected_delay" INTEGER,
    "recommendation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" SERIAL NOT NULL,
    "run_id" VARCHAR(20) NOT NULL,
    "incident_id" VARCHAR(50),
    "purchase_order_id" VARCHAR(50),
    "supplier" VARCHAR(100),
    "estimated_cost" DOUBLE PRECISION,
    "approval_status" VARCHAR(30),
    "execution_status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_reports" (
    "id" SERIAL NOT NULL,
    "run_id" VARCHAR(20) NOT NULL,
    "incident_id" VARCHAR(50),
    "executive_summary" TEXT,
    "report_file" VARCHAR(200),
    "excel_file" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "executive_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supply_chain_sku_key" ON "supply_chain"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_department_key" ON "budgets"("department");

-- CreateIndex
CREATE UNIQUE INDEX "procurement_purchase_id_key" ON "procurement"("purchase_id");

-- CreateIndex
CREATE UNIQUE INDEX "cloud_costs_month_key" ON "cloud_costs"("month");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_id_key" ON "contracts"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_runs_run_id_key" ON "pipeline_runs"("run_id");

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "pipeline_runs"("run_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "pipeline_runs"("run_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_reports" ADD CONSTRAINT "executive_reports_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "pipeline_runs"("run_id") ON DELETE RESTRICT ON UPDATE CASCADE;
