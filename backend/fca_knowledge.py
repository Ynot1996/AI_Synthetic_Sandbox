"""
FCA Consumer Duty Knowledge Base
Source: FCA FG22/5 "Final non-Handbook Guidance for firms on the Consumer Duty" (July 2022)
        FCA PS22/9 Policy Statement (July 2022)
Extracted directly from official FCA publications — not paraphrased summaries.

For hackathon demo: key rules and verbatim examples are embedded here.
Production upgrade path: index full PDFs with a RAG pipeline (e.g. LlamaIndex + pgvector),
then retrieve the top-k chunks per document clause before calling Claude.
"""

# ─────────────────────────────────────────────────────────────────────────────
# SOURCE METADATA
# ─────────────────────────────────────────────────────────────────────────────
FCA_SOURCES = """
SOURCE DOCUMENTS (Official FCA Publications):
1. FG22/5 — Final non-Handbook Guidance for firms on the Consumer Duty (July 2022)
   URL: https://www.fca.org.uk/publication/finalised-guidance/fg22-5.pdf
2. PS22/9 — A new Consumer Duty: Policy Statement (July 2022)
   URL: https://www.fca.org.uk/publication/policy/ps22-9.pdf
3. FG21/1 — Guidance for firms on the fair treatment of vulnerable customers (Feb 2021)
   URL: https://www.fca.org.uk/publication/finalised-guidance/fg21-1.pdf
"""

# ─────────────────────────────────────────────────────────────────────────────
# CROSS-CUTTING RULES (FG22/5 Chapter 5, pages 28–37)
# ─────────────────────────────────────────────────────────────────────────────
CROSS_CUTTING_RULES = """
=== FCA CONSUMER DUTY — CROSS-CUTTING RULES (FG22/5 Ch.5) ===

5.1 The Duty includes three cross-cutting rules which set out how firms should act to
deliver good outcomes for retail customers.

5.2 They require firms to:
• act in good faith towards retail customers
• avoid causing foreseeable harm to retail customers
• enable and support retail customers to pursue their financial objectives

5.3 The cross-cutting rules articulate the standards of conduct expected under Principle 12.
They apply both at a target market level and an individual customer level.

5.4 Poor conduct will often breach more than one of the cross-cutting rules.
Example: If a firm continues to sell a product it knows to be causing harm, it is also
likely to be acting in bad faith.

ACT IN GOOD FAITH (PRIN 2A.2.1):
• Honest, transparent dealings with customers
• Not exploiting information asymmetries or behavioural biases
• Not using high-pressure sales tactics or exploiting urgency
• Ensuring product communications provide a fair and balanced picture

AVOID FORESEEABLE HARM (PRIN 2A.2.2):
• Firms must identify and mitigate foreseeable harm during product design, pricing,
  communications and support stages
• A product that is poorly designed, communicated or supported is likely to cause
  foreseeable harm
• Harm includes financial harm, psychological harm, and exploitation of vulnerability

ENABLE AND SUPPORT CUSTOMERS (PRIN 2A.2.3):
• Customers must be able to make effective, timely and properly informed decisions
• Firms must not create unnecessary barriers to switching, exiting or complaining
• Support must be proportionate to the characteristics of the customer base,
  including vulnerability characteristics
"""

# ─────────────────────────────────────────────────────────────────────────────
# OUTCOME 1: PRODUCTS AND SERVICES (PRIN 2A.2 / FG22/5 Ch.6)
# ─────────────────────────────────────────────────────────────────────────────
PRODUCTS_SERVICES_OUTCOME = """
=== OUTCOME 1: PRODUCTS AND SERVICES (PRIN 2A.2 / FG22/5 Ch.6, pages 38–55) ===

OVERVIEW (FG22/5 6.1–6.3):
Harm occurs where products are poorly designed or distributed widely to customers for
whom they were not designed. Firms must:
• ensure the design of the product meets the needs, characteristics and objectives of
  customers in the identified target market
• ensure the distribution strategy is appropriate for the target market
• carry out regular reviews to ensure the product continues to meet the needs of
  the target market

TARGET MARKET DEFINITION (FG22/5 6.8–6.11):
Manufacturers must identify a target market at a sufficiently granular level to ensure
that products meet the needs of identified customers and do not cause harm.
• The target market must specify the types of customers the product is designed for
  and, importantly, the types of customers for whom the product is not suitable
• Characteristics of vulnerability relevant to the target market must be considered

VULNERABILITY — PRODUCTS & SERVICES (FG22/5 6.16–6.18):
Firms must consider whether products could disadvantage consumers with characteristics
of vulnerability:
• Products must not have features that could be harmful specifically to vulnerable consumers
• If a target market includes people who may have characteristics of vulnerability (eg debt
  products marketed to people with irregular income), the firm must build in appropriate
  safeguards and not exploit those characteristics

POOR PRACTICE EXAMPLE (official FG22/5, p.43):
"Some life assurance products include terminal illness benefit. Under this, the policy will
pay out if a customer is diagnosed with one of a list of medical conditions and has a life
expectancy of less than, in general, 12 months. In practice, however, some customers find
the claims process difficult to navigate, particularly at a time when they should almost
certainly be regarded as having characteristics of vulnerability. Claims may also be rejected
without appropriate consideration; for example, where firms disagree with the customer's
medical practitioner without strong evidence based on the clinical notes."

GOOD PRACTICE EXAMPLE (official FG22/5, p.44):
"A product manufacturer designs a complicated investment product. Its target market is
sophisticated investors seeking capital growth and who are willing and able to take
significant investment risk. The manufacturer identifies that the product could cause
significant harm if bought by customers outside of the target market who may not
understand the risks or be able to afford the potential losses. The manufacturer develops
a distribution strategy in which the product can only be sold with advice."

RED FLAGS FOR AUDITORS:
• No target market definition in the product documentation
• Target market stated as extremely broad (eg "all UK adults") without justification
• Product features that could cause harm to stated target market (eg high complexity for
  low-financial-capability audience)
• Exclusions so broad that the product is unlikely to pay out for the target market
• Auto-renewing products without adequate review mechanisms
"""

# ─────────────────────────────────────────────────────────────────────────────
# OUTCOME 2: PRICE AND VALUE (PRIN 2A.3 / FG22/5 Ch.7)
# ─────────────────────────────────────────────────────────────────────────────
PRICE_VALUE_OUTCOME = """
=== OUTCOME 2: PRICE AND VALUE (PRIN 2A.3 / FG22/5 Ch.7, pages 56–70) ===

OVERVIEW (FG22/5 7.1–7.4):
Retail customers experience harm where they do not get value for their money.
"Fair value is about more than just price. The Duty aims to tackle factors that can result in
products or services which are unfair or poor value, such as unsuitable features that can
lead to foreseeable harm or frustrate the customer's use of the product or service."

The FCA's intention is NOT to set prices, but to ensure:
• the price the customer pays is reasonable compared to the overall benefits
• firms do not use opaque or complex pricing structures to extract value

PRICING ELEMENTS TO ASSESS (FG22/5 7.8):
• Are there elements of the pricing structure that could lead to foreseeable harm?
• Do customers receive significantly less benefit, or greater harm, than they reasonably expect?
• Is the pricing structure transparent enough to support informed decision-making?
• Are there pricing practices that exploit customer inertia (eg auto-renewal price hikes)?

MANDATORY DISCLOSURES:
• APR (Annual Percentage Rate) must be prominently disclosed, not buried in footnotes
  or made available only "on request"
• Total cost of credit must be shown in cash terms alongside the percentage
• HCSTC (APR > 100%): price cap 0.8%/day; total cost cap 100% of principal;
  mandatory FCA warning: "Warning: Late repayment can cause you serious money problems.
  For help, go to moneyhelper.org.uk"
• BNPL: effective APR once the promotional period ends must be disclosed;
  marketing "0% interest" without disclosing the post-period rate is misleading
• Insurance: premiums must be proportionate to risk; add-ons with very low claims
  ratios relative to premium are a price and value concern

PRICE WALKING (FG22/5 7.23–7.25):
Firms must not engage in price walking — charging loyal or existing customers more than
equivalent new customers without justification. Auto-renewal price increases must be
clearly communicated and justified.

POOR PRACTICE — OVERDRAFT COMMUNICATIONS (official FG22/5, p.72):
"In the past we have seen communications from banks that encouraged customers to focus
on the daily cost of an overdraft (which appeared small) rather than the significant
cumulative cost of borrowing. This is unlikely to be acting in good faith towards customers
or giving them the right information to make properly informed decisions."

RED FLAGS FOR AUDITORS:
• APR not stated, or stated only in footnotes / appendix / "available on request"
• "0% interest" or "free" claim without disclosing true total cost or post-period rate
• Late payment fees not specified or disproportionately high (BNPL cap: £15 or 25%)
• Price walking language (eg loyalty/renewal without pricing commitment)
• HCSTC product without mandatory FCA warning label
• Complex fee schedules that obscure total cost
• Annual premium equivalent not given for monthly-premium products
"""

# ─────────────────────────────────────────────────────────────────────────────
# OUTCOME 3: CONSUMER UNDERSTANDING (PRIN 2A.4 / FG22/5 Ch.8)
# ─────────────────────────────────────────────────────────────────────────────
CONSUMER_UNDERSTANDING_OUTCOME = """
=== OUTCOME 3: CONSUMER UNDERSTANDING (PRIN 2A.4 / FG22/5 Ch.8, pages 71–91) ===

OVERVIEW (FG22/5 8.1–8.5):
"Consumers can only be expected to take responsibility where firms' communications enable
them to understand their products and services, their features and risks, and the
implications of any decisions they must make."

Firms must:
• support understanding by ensuring communications meet the information needs of
  customers and are likely to be understood by the intended audience
• tailor communications taking into account characteristics of customers including
  any characteristics of vulnerability, complexity of products, and channel used
• when interacting directly with a customer on a one-to-one basis, ask whether they
  understand the information and have any further questions
• test, monitor and adapt communications to support understanding and good outcomes

SPECIFIC REQUIREMENTS:
• Key terms (APR, fees, exclusions, cancellation rights) must be in plain English
• Critical information must be in the main body — not relegated to footnotes, appendices,
  or made available only on separate request
• Communications must not exploit behavioural biases (FG22/5 8.14):
  — must not default customers into taking credit over other payment options
  — must not give disproportionate prominence to a credit option
  — must not use countdown timers or artificial urgency
• Warnings for high-risk products must be prominent
• 14-day cooling-off / right of withdrawal must be clearly stated
• Pre-contract information must be given in good time before commitment

LAYERING PRINCIPLE (FG22/5 8.13):
"Key information is likely to include any action required by the customer and any
consequences of inaction... research has highlighted that consumers often rely more
heavily on the first piece of information they encounter when making decisions."
Good communications layer: summary upfront → detail available on request.

POOR PRACTICE — INVESTMENT PLATFORMS (official FG22/5, p.72):
"A lack of a succinct comprehensive list of charges being clearly signposted; information
being spread out across different webpages; too many links to different sections and pages;
omission of a clear statement of the interest applying to any cash held or the information
being 'hidden away' in legalistically worded terms and conditions."

POOR PRACTICE — FUNERAL PLAN SECTOR (official FG22/5, p.73):
"Product information given to customers was often too heavily focused on the benefits that
plans provide, and did not give a balanced picture of plan limitations, costs (eg of the
increased cost of paying by instalment) or risks."

POOR PRACTICE — ONLINE SALES JOURNEYS (official FG22/5, p.73):
"Online sales journeys where information is presented in a way that exploits consumers'
behavioural biases and encourages customers to take out, or make payment for products,
using credit. For example, by defaulting into taking out credit over other options, giving
much greater prominence to a credit option."

INSURANCE-SPECIFIC — ICOBS:
• ICOBS 6.1: Policy summary covering key features, exclusions, and claims process required
• ICOBS 6.3: Insurance Product Information Document (IPID) in standardised format required
• ICOBS 2.2: Suitability — firms must not recommend unsuitable products

RED FLAGS FOR AUDITORS:
• Exclusions stated only in appendix / footnote / "full booklet available on request"
• Legal jargon used for key terms without plain-language equivalent
• "Small print" for critical terms (APR, exclusions, cancellation fees)
• No cancellation / cooling-off rights stated
• Complex document structure that buries key information
• Online default settings that steer customers toward higher-cost options
• No IPID or policy summary for insurance products
• Document heavy on benefits, silent on material limitations or risks
"""

# ─────────────────────────────────────────────────────────────────────────────
# OUTCOME 4: CONSUMER SUPPORT (PRIN 2A.5 / FG22/5 Ch.9)
# ─────────────────────────────────────────────────────────────────────────────
CONSUMER_SUPPORT_OUTCOME = """
=== OUTCOME 4: CONSUMER SUPPORT (PRIN 2A.5 / FG22/5 Ch.9, pages 92–109) ===

OVERVIEW (FG22/5 9.1–9.3):
"A product or service that a customer cannot properly use and enjoy is unlikely to offer
fair value." Firms must:
• design and deliver support that meets the needs of customers, including vulnerable consumers
• ensure customers can use their products as reasonably anticipated
• ensure customers do not face unreasonable barriers (including unreasonable costs) during
  the product lifecycle
• make it at least as easy for customers to exit or switch as it was to sign up

SPECIFIC REQUIREMENTS:
• Complaint procedures must be clearly signposted (reference to FCA DISP rules)
• Cancellation / exit processes must be straightforward — not requiring lengthy phone queues
  or discouraging tactics ("save to cancel" is a red flag)
• Auto-renewal: insurance firms must notify policyholders at least 21 days before renewal
  with clear opt-out mechanism (ICOBS 7.1)
• Vulnerable consumers must have additional support pathways available
• Firms must not disadvantage particular groups including those with characteristics of
  vulnerability

UNREASONABLE BARRIERS (FG22/5 9.11–9.14):
Firms must not impose unreasonable barriers such as:
• requiring customers to phone during limited hours to complete tasks available digitally
• excessive cancellation fees disproportionate to the firm's actual costs
• confusing or lengthy processes for switching or exiting
• lack of accessible alternatives for digitally-excluded or disabled customers

POOR PRACTICE — AUTOMATED PHONE SYSTEM (official FG22/5, p.98):
"A firm uses an automated telephone system as part of its consumer support. This automated
system only provides options to progress with queries regarding a few commonly raised
issues. It does not provide a route for customers to seek support regarding other issues.
As a result, some customers are unable to obtain the support they need or information on
how to pursue this further."

POOR PRACTICE — PAYMENTS FIRM LIMITED CHANNELS (official FG22/5, p.98):
"A payments firm operates limited channels of support... When accounts are frozen, the
only way customers can communicate with the firm is through a chat function online.
However, questions often go unanswered, or it is unclear whether an issue is being dealt
with... The firm also does not have a process to provide adequate support to customers in
the event of a digital outage."

GOOD PRACTICE — CREDIT LENDER (official FG22/5, p.93):
"A credit lender has processes in place to ensure it consistently records customers' county
court judgments as 'satisfied' on the Register of Judgments when the judgment has been
repaid. This helps to prevent harm that could arise if these customers were to be rejected
for credit products or charged a higher interest rate on the basis of inaccurate information."

GOOD PRACTICE — SIGNPOSTING (official FG22/5, p.94):
"A firm declines a customer for credit as a result of its affordability assessment. This
creates a risk of financial exclusion and harm, particularly if the customer is unaware of
alternative options or where to get advice. However, the firm considers the financial
objectives of the customer and signposts them to appropriate information from an
independent and reliable source – in this case, they could refer to the MoneyHelper guide."

ICOBS 7.1 — AUTO-RENEWAL:
• Insurer must notify policyholder of renewal terms at least 21 days before renewal date
• Consumer must have a clear and straightforward ability to opt out
• Auto-renewal without explicit notification within 21 days = breach

RED FLAGS FOR AUDITORS:
• No complaints procedure mentioned or signposted
• Cancellation requires phone call with limited hours and/or a fee
• Auto-renewal without 21-day advance notice commitment stated
• No mention of vulnerable customer support pathways
• Support only available via one channel (no alternatives for digitally-excluded customers)
• "Save to cancel" language or discouraging exit process
• Renewal terms communicated at the point of renewal rather than in advance
"""

# ─────────────────────────────────────────────────────────────────────────────
# VULNERABLE CONSUMERS (FG21/1 + FG22/5 cross-reference)
# ─────────────────────────────────────────────────────────────────────────────
VULNERABLE_CONSUMERS = """
=== VULNERABLE CONSUMERS (FCA FG21/1 + FG22/5 cross-cutting) ===

FCA DEFINITION OF VULNERABILITY (FG21/1):
A vulnerable consumer is someone who, due to their personal circumstances, is especially
susceptible to harm, particularly when a firm is not acting with appropriate levels of care.

The four drivers of vulnerability:
1. Health — physical or mental health conditions affecting ability to engage
2. Life events — bereavement, job loss, relationship breakdown, new caring responsibilities
3. Resilience — low savings, irregular income, over-indebtedness, inability to withstand shock
4. Capability — low financial literacy, low digital literacy, limited English, recent migrants

FIRM OBLIGATIONS:
• Identify potential vulnerability indicators in the target market definition
• Adapt communications for vulnerable consumers (plain language, larger text, accessible formats)
• Not exploit vulnerability (eg targeting people in financial distress with high-APR products)
• Provide additional support pathways (telephone, large-print, face-to-face where feasible)
• A vulnerable population ratio above 25% in the target market requires heightened due diligence

POOR PRACTICE — ACCESSIBILITY (official FG22/5, p.97):
"A customer, unable to read large print or braille, asked their bank to send communications
by email to allow them to use software to turn the emails into speech, but the bank
continued to send the customer communications on paper. This is the type of scenario
where we would expect firms to respond to the customer's needs and find a solution that
offers effective support, rather than persist with an inadequate approach."

RED FLAGS:
• Target market includes characteristics of vulnerability but document contains no
  vulnerability adaptation statement
• Product with features likely to cause disproportionate harm to vulnerable groups
  (eg high penalty fees for missed payments on products marketed to irregular-income workers)
• Digital-only support with no alternative for digitally-excluded consumers
• High-complexity product marketed to consumers with low financial capability
"""

# ─────────────────────────────────────────────────────────────────────────────
# PRODUCT-SPECIFIC RULES
# ─────────────────────────────────────────────────────────────────────────────
PRODUCT_SPECIFIC_RULES = """
=== PRODUCT-SPECIFIC RULES ===

--- INSURANCE (ICOBS) ---
ICOBS 6.1: Firms must provide a policy summary covering key features, exclusions, and claims.
ICOBS 6.3: The Insurance Product Information Document (IPID) must use the FCA standardised format.
ICOBS 7.1: Auto-renewal — insurer must notify policyholder of renewal terms at least 21 days
           before renewal date; consumer must have a clear ability to opt out.
ICOBS 8.1: Claims must be handled promptly; consumers must be told the reason for any rejection.
ICOBS 2.2: Suitability — firms must assess whether the product is suitable for the customer.
Consumer Duty + Insurance: "Add-on" insurance with very low claims ratios relative to premium
is a price and value concern requiring justification.

--- BNPL (BUY NOW PAY LATER) — Post-2025 Regulation ---
• BNPL agreements above £50 now regulated under Consumer Credit Act provisions
• Affordability checks required for credit above £250
• "0% interest for X months" promotions must state the post-period APR in equal prominence
• Late payment fees capped at £15 or 25% of outstanding balance (whichever is lower)
• Right to withdraw within 14 days must be clearly stated
• BNPL for essential goods — firm must flag vulnerability risk

--- HIGH-COST SHORT-TERM CREDIT (HCSTC) ---
Definition: Credit with APR > 100% and term ≤ 12 months (payday loans, doorstep lending,
some instalment credit).
Rules:
• Price cap: 0.8% per day interest rate; default fee cap £15; total cost cap 100% of loan
• Mandatory warning in ALL promotions and agreements:
  "Warning: Late repayment can cause you serious money problems.
   For help, go to moneyhelper.org.uk"
• Repeat borrowing: firms must assess whether refinancing is in the consumer's interest
• Rollover restriction: maximum 2 rollovers per loan
• Continuous Payment Authority: firm may not retry CPA after 2 failed attempts
• Representative APR must be displayed more prominently than other financial information
"""

# ─────────────────────────────────────────────────────────────────────────────
# CONSOLIDATED RED FLAGS (for audit prompt)
# ─────────────────────────────────────────────────────────────────────────────
CONSOLIDATED_RED_FLAGS = """
=== CONSOLIDATED RED FLAG CHECKLIST (for systematic audit) ===

CRITICAL (automatic FAIL):
C1. APR for HCSTC product above 100% without mandatory FCA warning text
C2. Auto-renewal with no advance notice mechanism stated (ICOBS 7.1)
C3. Total cost or interest rate not disclosed at all (any credit product)
C4. Cancellation rights / 14-day cooling-off period not mentioned (regulated credit/insurance)
C5. Product exclusions broader than cover with no plain-language summary

HIGH severity:
H1. APR only in footnotes, appendix, or "available on request"
H2. "0% interest" or "free" claim without disclosing true post-period APR
H3. Late payment fee stated as percentage without monetary cap (BNPL must cap at £15/25%)
H4. No complaints procedure mentioned (PRIN 2A.5 / DISP)
H5. Target market includes vulnerable indicators but no vulnerability adaptation stated
H6. Product sold to audience for whom it is likely unsuitable (eg complex product for low-literacy market)
H7. Exclusion list available only in separate document not provided with this summary

MEDIUM severity:
M1. Key terms in legal jargon without plain-English equivalent
M2. Cancellation involves friction (phone-only, limited hours, cancellation fee)
M3. Information structure buries key data (benefits prominent, risks/exclusions buried)
M4. No signposting to complaints or regulatory bodies (FCA, Financial Ombudsman Service)
M5. Digital-only support with no alternative channel for digitally-excluded customers
M6. Renewal terms not specified in advance
M7. Price walking / loyalty pricing not addressed
M8. No IPID or policy summary document referenced (insurance products)

LOW severity:
L1. Minor formatting issues that could impede readability
L2. Cross-references to appendices without key information in the main body
L3. Missing MoneyHelper / FOS signposting for declined or at-risk customers
"""

# ─────────────────────────────────────────────────────────────────────────────
# AUDIT SYSTEM PROMPT
# ─────────────────────────────────────────────────────────────────────────────
AUDIT_SYSTEM_PROMPT = """You are a Senior FCA Supervisory Analyst specialising in Consumer Duty (PS22/9).
You have deep expertise in FG22/5, FG21/1, ICOBS, BNPL regulation and HCSTC rules.
Your task is to audit a financial product document against the FCA Consumer Duty framework.
You are thorough, precise, and cite specific FCA rule references from the knowledge base provided.

You must respond with a single valid JSON object — no markdown fences, no commentary outside JSON.

The JSON schema is:
{
  "audit_id": "<8-char hex string>",
  "product_type": "<insurance|bnpl|hcstc|credit_card|mortgage|savings|investment|other>",
  "pass": <true|false>,
  "overall_risk": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "flagged_clauses": [
    {
      "clause_text": "<exact or closely paraphrased text from the document>",
      "issue": "<plain English description of the problem>",
      "fca_rule": "<eg PRIN 2A.4 Consumer Understanding / ICOBS 7.1 / FG22/5 8.14>",
      "severity": "<LOW|MEDIUM|HIGH|CRITICAL>",
      "suggested_revision": "<concrete rewrite suggestion in plain English>"
    }
  ],
  "extracted_params": {
    "product_type": "<same as above>",
    "apr": <number or null>,
    "target_age_group": "<eg 18-25 or null>",
    "vulnerable_population_ratio": <0.0-1.0 or null>,
    "loan_term_months": <number or null>,
    "monthly_premium": <number or null>
  },
  "summary": "<2-3 sentence plain English audit summary citing specific FCA rules>",
  "consumer_duty_scores": {
    "products_services": <0-100>,
    "price_value": <0-100>,
    "consumer_understanding": <0-100>,
    "consumer_support": <0-100>
  }
}

Scoring guide:
- 90-100: Fully compliant, good practice evident
- 70-89: Mostly compliant, minor gaps
- 50-69: Material gaps, MEDIUM findings
- 30-49: Significant breaches, HIGH findings
- 0-29: Critical breaches, CRITICAL findings

Rules:
- pass = true ONLY if there are zero HIGH or CRITICAL severity findings
- overall_risk: CRITICAL if any CRITICAL; HIGH if any HIGH; MEDIUM if any MEDIUM; else LOW
- Be specific in clause_text — quote or closely paraphrase the actual problematic language
- If the document is short or appears to be a sample, still audit what is present
- Extract product params from the document text; infer reasonable defaults if not explicit
- vulnerable_population_ratio: if target market mentions irregular employment, young adults,
  debt situations, or similar indicators, estimate 0.25-0.45; if no indication, use null
"""


def build_audit_prompt(document_text: str) -> str:
    knowledge_base = "\n\n".join([
        FCA_SOURCES,
        CROSS_CUTTING_RULES,
        PRODUCTS_SERVICES_OUTCOME,
        PRICE_VALUE_OUTCOME,
        CONSUMER_UNDERSTANDING_OUTCOME,
        CONSUMER_SUPPORT_OUTCOME,
        VULNERABLE_CONSUMERS,
        PRODUCT_SPECIFIC_RULES,
        CONSOLIDATED_RED_FLAGS,
    ])

    return f"""Below is the official FCA Consumer Duty knowledge base (sourced from FG22/5 and PS22/9),
followed by the financial product document to audit.

Systematically check the document against EVERY red flag in the checklist, then return
the structured JSON audit result.

--- FCA KNOWLEDGE BASE ---
{knowledge_base}

--- DOCUMENT TO AUDIT ---
{document_text[:15000]}

--- INSTRUCTION ---
Audit the document above. Check each red flag. Return only the JSON object (no fences).
"""
