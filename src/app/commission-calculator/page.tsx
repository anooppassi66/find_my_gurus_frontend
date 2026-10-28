"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { api } from "@/lib/api";
import { CommissionBand, CommissionCalculation } from "@/lib/types";
import { money } from "@/lib/format";

function bandMoney(value: string | number) {
  return "$" + Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function bandLabel(minAmount: string, maxAmount: string | null) {
  const min = parseFloat(minAmount);
  if (min === 0) return `Under ${bandMoney(maxAmount ?? 0)}`;
  if (maxAmount === null) return `${bandMoney(minAmount)}+`;
  return `${bandMoney(minAmount)} – ${bandMoney(maxAmount)}`;
}

function CommissionCalculatorContent() {
  const [amount, setAmount] = useState("1250");
  const [calc, setCalc] = useState<CommissionCalculation | null>(null);
  const [bands, setBands] = useState<CommissionBand[]>([]);

  useEffect(() => {
    api
      .get<CommissionBand[]>("/commission/bands")
      .then(setBands)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const n = parseFloat(amount);
    if (isNaN(n)) {
      setCalc(null);
      return;
    }
    const handle = setTimeout(() => {
      api
        .get<CommissionCalculation>(`/commission/calculate?amount=${encodeURIComponent(n)}`)
        .then(setCalc)
        .catch(() => setCalc(null));
    }, 250);
    return () => clearTimeout(handle);
  }, [amount]);

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">Admin-configurable, price-banded</div>
        <h1>Commission calculator</h1>
        <p>Commission rate depends on the contract/milestone price band. Bands and rates are dynamic and managed by admin.</p>
      </div>

      <div className="grid grid-sidebar">
        <div className="card">
          <div className="field">
            <label>Milestone / contract amount (USD)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <hr className="divider" />
          <table>
            <tbody>
              <tr>
                <td>Gross amount</td>
                <td style={{ textAlign: "right" }}>{calc ? money(calc.amount) : "—"}</td>
              </tr>
              <tr>
                <td>Applicable band</td>
                <td style={{ textAlign: "right" }}>
                  <span className="badge badge-info">{calc ? bandLabel(calc.band.minAmount, calc.band.maxAmount) : "—"}</span>
                </td>
              </tr>
              <tr>
                <td>Commission rate</td>
                <td style={{ textAlign: "right" }}>{calc ? `${parseFloat(calc.ratePct)}%` : "—"}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--color-danger)" }}>Commission amount</td>
                <td style={{ textAlign: "right", color: "var(--color-danger)" }}>{calc ? `– ${money(calc.commission)}` : "—"}</td>
              </tr>
              <tr>
                <td>
                  <strong>Guru receives</strong>
                </td>
                <td style={{ textAlign: "right" }}>
                  <strong>{calc ? money(calc.net) : "—"}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <aside className="stack">
          <div className="card">
            <h3>Commission bands</h3>
            <table>
              <tbody>
                <tr>
                  <th>Band</th>
                  <th style={{ textAlign: "right" }}>Rate</th>
                </tr>
                {bands.map((b) => (
                  <tr key={b.id}>
                    <td>{bandLabel(b.minAmount, b.maxAmount)}</td>
                    <td style={{ textAlign: "right" }}>{parseFloat(b.ratePct)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hint">Bands and rates are configurable in admin.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function CommissionCalculatorPage() {
  return (
    <DashboardShell>
      <CommissionCalculatorContent />
    </DashboardShell>
  );
}
