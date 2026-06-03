"""
PDF report generator for Universal RegTech OS audit results.
Uses fpdf2 to produce a clean, professional FCA compliance audit report.
"""

import io
from datetime import datetime
from fpdf import FPDF

# fpdf2's core fonts (Helvetica) only support latin-1. Gemini's audit text is
# full of typographic Unicode (em-dashes, curly quotes, arrows, ellipses) which
# would raise an encoding error and produce a corrupt download. Map the common
# offenders to ASCII, then drop anything still outside latin-1 as a safety net.
_CHAR_MAP = {
    "—": "-",  "–": "-",   "−": "-",          # em/en dash, minus
    "‘": "'",  "’": "'",   "′": "'",          # curly single quotes, prime
    "“": '"',  "”": '"',   "″": '"',          # curly double quotes
    "…": "...", "•": "-",  "·": "-",          # ellipsis, bullets
    "→": "->", "←": "<-",  "↑": "^", "↓": "v",
    " ": " ",  " ": " ",   " ": " ", "​": "",
    "€": "EUR",
}


def _s(text) -> str:
    if text is None:
        return ""
    text = str(text)
    for k, v in _CHAR_MAP.items():
        text = text.replace(k, v)
    return text.encode("latin-1", "replace").decode("latin-1")


SEV_COLOR = {
    "CRITICAL": (239, 68, 68),
    "HIGH":     (249, 115, 22),
    "MEDIUM":   (234, 179, 8),
    "LOW":      (34, 197, 94),
}

BG   = (8, 9, 10)
CARD = (18, 20, 22)
TEXT = (220, 220, 225)
DIM  = (120, 120, 130)
BLUE = (79, 156, 249)
TEAL = (0, 212, 170)


class RegTechPDF(FPDF):
    def header(self):
        # Top accent bar
        self.set_fill_color(*BLUE)
        self.rect(0, 0, 210, 1.5, "F")
        self.ln(6)

        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*DIM)
        self.cell(0, 6, "UNIVERSAL REGTECH OS  ·  FCA Consumer Duty Audit Report", align="C")
        self.ln(4)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(*DIM)
        self.cell(0, 5,
                  f"Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}  ·  "
                  f"FCA PS22/9 · FG22/5  ·  Page {self.page_no()} / {{nb}}",
                  align="C")

    def section_title(self, text):
        self.set_font("Helvetica", "B", 7)
        self.set_text_color(*DIM)
        self.cell(0, 5, _s(text).upper(), ln=True)
        self.set_draw_color(*BLUE)
        self.set_line_width(0.3)
        self.line(self.get_x(), self.get_y(), self.get_x() + 190, self.get_y())
        self.ln(3)

    def kv_row(self, key, value, value_color=None):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*DIM)
        self.cell(55, 6, _s(key))
        self.set_text_color(*(value_color or TEXT))
        self.set_font("Helvetica", "B", 8)
        # new_x=LMARGIN / new_y=NEXT keeps the cursor from drifting to the right
        # margin, which would push the following row off-page.
        self.multi_cell(0, 6, _s(value), new_x="LMARGIN", new_y="NEXT")

    def score_bar(self, label, rule, score):
        color = TEAL if score >= 70 else ((234, 179, 8) if score >= 45 else (239, 68, 68))
        x, y = self.get_x(), self.get_y()

        self.set_font("Helvetica", "", 7)
        self.set_text_color(*DIM)
        self.cell(38, 5, rule)
        self.set_text_color(*TEXT)
        self.set_font("Helvetica", "B", 7)
        self.cell(52, 5, label)

        # Score bar background
        bx = self.get_x() + 2
        by = self.get_y() + 1.5
        self.set_fill_color(35, 38, 42)
        self.rect(bx, by, 60, 2.5, "F")
        # Score bar fill
        self.set_fill_color(*color)
        self.rect(bx, by, 60 * score / 100, 2.5, "F")

        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*color)
        self.cell(68, 5, "")
        self.cell(15, 5, str(score), align="R")
        self.ln(6)


def generate_audit_pdf(audit_result: dict) -> bytes:
    pdf = RegTechPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(12, 14, 12)
    pdf.add_page()

    # Background
    pdf.set_fill_color(*BG)
    pdf.rect(0, 0, 210, 297, "F")

    # ── Cover block ────────────────────────────────────────────────────────────
    pdf.set_fill_color(*CARD)
    pdf.rect(10, 18, 190, 38, "F")
    pdf.set_xy(14, 22)

    verdict = "PASS" if audit_result.get("pass") else "FAIL"
    v_color = TEAL if audit_result.get("pass") else (239, 68, 68)

    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(*v_color)
    pdf.cell(60, 10, f"Consumer Duty {verdict}")

    pdf.set_xy(14, 33)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(*DIM)
    pdf.cell(0, 5, _s(
             f"Product: {audit_result.get('product_type','').replace('_',' ').upper()}  -  "
             f"Audit ID: {audit_result.get('audit_id','')}  -  "
             f"Risk Level: {audit_result.get('overall_risk','')}"))

    pdf.set_xy(14, 42)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(*TEXT)
    summary = audit_result.get("summary", "")
    pdf.multi_cell(182, 5, _s(summary))

    pdf.ln(6)

    # ── Consumer Duty Scorecard ────────────────────────────────────────────────
    pdf.section_title("Consumer Duty Scorecard — PS22/9")
    scores = audit_result.get("consumer_duty_scores", {})
    for key, label, rule in [
        ("products_services",      "Products & Services",    "PRIN 2A.2"),
        ("price_value",           "Price & Value",          "PRIN 2A.3"),
        ("consumer_understanding", "Consumer Understanding", "PRIN 2A.4"),
        ("consumer_support",      "Consumer Support",       "PRIN 2A.5"),
    ]:
        pdf.score_bar(label, rule, scores.get(key, 50))

    pdf.ln(4)

    # ── Extracted Parameters ──────────────────────────────────────────────────
    params = audit_result.get("extracted_params", {})
    if any(params.values()):
        pdf.section_title("Extracted Product Parameters")
        if params.get("apr"):
            pdf.kv_row("Annual Percentage Rate", f"{params['apr']}%", BLUE)
        if params.get("target_age_group"):
            pdf.kv_row("Target Age Group", params["target_age_group"])
        if params.get("vulnerable_population_ratio"):
            pct = round(params["vulnerable_population_ratio"] * 100)
            color = (239, 68, 68) if pct >= 30 else (234, 179, 8)
            pdf.kv_row("Vulnerable Population", f"{pct}%", color)
        if params.get("loan_term_months"):
            pdf.kv_row("Loan Term", f"{params['loan_term_months']} months")
        if params.get("monthly_premium"):
            pdf.kv_row("Monthly Premium", f"£{params['monthly_premium']}")
        pdf.ln(4)

    # ── Flagged Clauses ───────────────────────────────────────────────────────
    clauses = audit_result.get("flagged_clauses", [])
    order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    clauses.sort(key=lambda c: order.get(c.get("severity", "LOW"), 3))

    if clauses:
        pdf.section_title(f"Flagged Clauses — {len(clauses)} Findings")
        for i, clause in enumerate(clauses, 1):
            sev   = clause.get("severity", "MEDIUM")
            color = SEV_COLOR.get(sev, (234, 179, 8))

            # Clause header
            pdf.set_fill_color(*CARD)
            card_y = pdf.get_y()
            pdf.rect(10, card_y, 190, 6, "F")

            # Severity badge
            pdf.set_fill_color(*color)
            pdf.rect(10, card_y, 18, 6, "F")
            pdf.set_xy(10, card_y)
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_text_color(8, 9, 10)
            pdf.cell(18, 6, sev, align="C")

            # FCA rule ref
            pdf.set_text_color(*DIM)
            pdf.set_font("Helvetica", "", 7)
            pdf.cell(0, 6, _s(f"  {clause.get('fca_rule','')}"))
            pdf.ln(7)

            # Clause text
            pdf.set_font("Helvetica", "I", 8)
            pdf.set_text_color(*DIM)
            pdf.set_x(14)
            pdf.multi_cell(182, 4.5, _s(f'"{clause.get("clause_text","")}"'))
            pdf.ln(1)

            # Issue
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_text_color(*TEXT)
            pdf.set_x(14)
            pdf.cell(0, 4, "Issue:")
            pdf.ln(4)
            pdf.set_font("Helvetica", "", 7.5)
            pdf.set_text_color(180, 180, 190)
            pdf.set_x(14)
            pdf.multi_cell(182, 4.5, _s(clause.get("issue", "")))
            pdf.ln(1)

            # Suggested revision
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_text_color(*TEAL)
            pdf.set_x(14)
            pdf.cell(0, 4, "Suggested Revision:")
            pdf.ln(4)
            pdf.set_font("Helvetica", "", 7.5)
            pdf.set_text_color(0, 180, 145)
            pdf.set_x(14)
            pdf.multi_cell(182, 4.5, _s(clause.get("suggested_revision", "")))
            pdf.ln(5)

    # ── Regulatory References ─────────────────────────────────────────────────
    pdf.section_title("Regulatory References")
    refs = [
        ("PS22/9",  "FCA Policy Statement — A New Consumer Duty (July 2022)"),
        ("FG22/5",  "FCA Final Guidance for Firms on the Consumer Duty (July 2022)"),
        ("FG21/1",  "FCA Guidance — Fair Treatment of Vulnerable Customers (Feb 2021)"),
        ("PRIN 2A", "FCA Handbook — Consumer Duty Rules"),
        ("ICOBS",   "FCA Insurance Conduct of Business Sourcebook"),
    ]
    for code, desc in refs:
        pdf.set_font("Helvetica", "B", 7.5)
        pdf.set_text_color(*BLUE)
        pdf.cell(22, 5, _s(code))
        pdf.set_font("Helvetica", "", 7.5)
        pdf.set_text_color(*DIM)
        pdf.cell(0, 5, _s(desc), ln=True)

    return bytes(pdf.output())
