// Status Integrity Index (pressure-test finding F1).
//
// Confidence is driven by reported task progress (EV = avg progress × BAC). A PM
// can mark everything done and the score inflates — and crucially, over-claiming
// ALSO inflates CPI and SPI(t), so the cost and schedule indices move WITH the
// lie and can't catch it. The only honest checks are signals INDEPENDENT of the
// claimed-progress number:
//   • implied cost efficiency (CPI) implausibly high — claiming far more value
//     than spend supports;
//   • completion not corroborated by gates reached;
//   • near-complete with almost no spend recorded.
//
// We FLAG, never silently discount: the score stays computed (scoring weights are
// a fixed product decision), but we tell the PM the inputs may be overstated.
//
// Pure domain module: no store/UI imports.

export interface StatusIntegrityInput {
  percentComplete: number; // 0..1 — the CLAIM (EV / BAC)
  percentSpent: number;    // 0..1 — AC / BAC
  cpi: number;             // EV / AC
  gatesTotal: number;
  gatesComplete: number;
}

export type IntegrityBand = "consistent" | "watch" | "overstated";

export interface IntegrityFlag {
  kind: "efficiency-implausible" | "no-gate-corroboration" | "progress-without-spend";
  message: string;
}

export interface StatusIntegrity {
  band: IntegrityBand;
  flags: IntegrityFlag[];
}

export function computeStatusIntegrity(input: StatusIntegrityInput): StatusIntegrity {
  const { percentComplete, percentSpent, cpi, gatesTotal, gatesComplete } = input;
  const flags: IntegrityFlag[] = [];

  const pct = Math.round(percentComplete * 100);

  // 1. Implausibly high implied efficiency — the mathematical signature of
  //    over-reported EV (claiming much more value than spend supports).
  if (cpi >= 1.5 && percentComplete > 0.2 && percentSpent > 0) {
    flags.push({
      kind: "efficiency-implausible",
      message: `Reported progress implies ${cpi.toFixed(1)}× cost efficiency — high enough that the % complete may be ahead of real work. Verify it against evidence.`,
    });
  }

  // 2. Completion not corroborated by gates (independent of task claims). Needs
  //    HIGH claimed completion against a real gate spine — a normal mid-project
  //    with an early gate still pending is not suspicious.
  if (percentComplete >= 0.6 && gatesTotal >= 3 && gatesComplete === 0) {
    flags.push({
      kind: "no-gate-corroboration",
      message: `${pct}% of work is reported complete, but no milestone gates have been reached — completion isn't corroborated by the gate spine.`,
    });
  }

  // 3. Near-complete with almost no spend recorded — progress or cost entry is off.
  if (percentComplete > 0.5 && percentSpent < 0.1) {
    flags.push({
      kind: "progress-without-spend",
      message: `Reported near half-complete with almost no spend recorded — verify the progress or the cost actuals.`,
    });
  }

  const band: IntegrityBand =
    cpi >= 2 || flags.length >= 2 ? "overstated" : flags.length >= 1 ? "watch" : "consistent";

  return { band, flags };
}
