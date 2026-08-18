from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_CENTER

CYAN = colors.HexColor("#00A9B8")
DARK = colors.HexColor("#0D0D14")
ORANGE = colors.HexColor("#E24A00")
GREY = colors.HexColor("#444444")

OUT = "/app/frontend/public/HydroMind-X-Shark-Tank-Pitch.pdf"

styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, parent=styles["Normal"], **kw)

title = S("title", fontName="Helvetica-Bold", fontSize=24, textColor=DARK, leading=28, spaceAfter=2)
subtitle = S("subtitle", fontName="Helvetica-Oblique", fontSize=11, textColor=CYAN, leading=14, spaceAfter=2)
tagline = S("tagline", fontName="Helvetica", fontSize=9, textColor=GREY, leading=12)
h2 = S("h2", fontName="Helvetica-Bold", fontSize=13, textColor=colors.white, leading=16,
       backColor=DARK, borderPadding=(6, 6, 6, 6), spaceBefore=14, spaceAfter=8, leftIndent=0)
body = S("body", fontName="Helvetica", fontSize=10.5, textColor=colors.HexColor("#222222"), leading=15, spaceAfter=6)
quote = S("quote", fontName="Helvetica-Oblique", fontSize=10.5, textColor=DARK, leading=15,
          leftIndent=12, borderColor=CYAN, borderWidth=0, backColor=colors.HexColor("#EAFBFD"),
          borderPadding=(8, 8, 8, 8), spaceAfter=8)
cue = S("cue", fontName="Helvetica-Bold", fontSize=9.5, textColor=ORANGE, leading=13, spaceAfter=3)
bullet = S("bullet", fontName="Helvetica", fontSize=10.5, textColor=colors.HexColor("#222222"), leading=15)
small = S("small", fontName="Helvetica", fontSize=8.5, textColor=GREY, leading=11, alignment=TA_CENTER)

story = []

def hr(c=CYAN, w=1.2):
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=w, color=c, spaceAfter=6))

def q(text):
    story.append(Paragraph(text, quote))

def p(text):
    story.append(Paragraph(text, body))

def sec(text):
    story.append(Paragraph(text, h2))

def cuep(text):
    story.append(Paragraph(text, cue))

def blist(items):
    story.append(ListFlowable(
        [ListItem(Paragraph(i, bullet), leftIndent=10, value="•") for i in items],
        bulletType="bullet", start="•", leftIndent=14, spaceAfter=6,
    ))

# ---------- Header ----------
story.append(Paragraph("HYDROMIND-X", title))
story.append(Paragraph("Shark Tank Pitch Script &nbsp;&bull;&nbsp; Team AquaNova Trinity", subtitle))
story.append(Paragraph('"Making AI Think Before It Drinks."', tagline))
hr()

story.append(Paragraph(
    "<b>Timing target:</b> ~3 min pitch + Q&amp;A &nbsp;|&nbsp; Hook 20s &bull; Problem 30s &bull; "
    "Solution + Demo 90s &bull; Market + Ask 30s &bull; Close 15s", small))
story.append(Spacer(1, 6))

# ---------- 1 Hook ----------
sec("1 &nbsp; THE HOOK &nbsp;(say this before your name)")
q('"Sharks — every time you ask an AI a single question, it drinks a bottle of water. '
  'Now multiply that by billions of questions a day. The AI revolution isn\'t just burning '
  'electricity… it\'s drinking our rivers dry."')
cuep("(pause 2 seconds — let it land)")
q('"Hi Sharks, I\'m Anbumathi Chezhian, founder of HydroMind-X, and we\'re here to make '
  'artificial intelligence think before it drinks."')
p("<b>Why it works:</b> a shocking, physical, relatable image plus a memorable one-liner. "
  "Sharks remember hooks, not features.")

# ---------- 2 Problem ----------
sec("2 &nbsp; THE PROBLEM &nbsp;(urgent + big)")
q('"AI data centers generate massive heat, and to cool them we pour millions of litres of clean '
  'freshwater into cooling towers — even during droughts. Today these centers optimize for energy, '
  'speed, and cost. Water? An afterthought. Audits happen once a quarter, cooling never adapts, and '
  'communities pay the price when reservoirs run low. As AI grows, this gets worse every day. '
  'Nobody treats water as a decision — until now."')

# ---------- 3 Solution ----------
sec("3 &nbsp; THE SOLUTION &nbsp;(one clear sentence)")
q('"HydroMind-X is an AI-driven water intelligence platform. We connect IoT sensors to any data '
  'center and, in real time, calculate one simple number — the Water Availability Index, 0 to 100 — '
  'then our AI automatically decides how to cool and what workloads to run, to save every possible drop."')

# ---------- 4 Demo ----------
sec("4 &nbsp; THE LIVE DEMO &nbsp;(this wins it — narrate as you click)")
cuep("Beat 1 — Normal state")
q('"Right now water is plentiful — our index reads green. The AI runs normal liquid cooling and '
  'every workload is live."')
cuep("Beat 2 — Create the crisis (drag sliders: Water Level down, Cooling Demand up, Weather = Drought)")
q('"But watch what happens when a heatwave hits and the reservoir drops… The index crashes into the '
  'red — and instantly, with zero human intervention, HydroMind-X switches to dry cooling, keeps '
  'hospitals and emergency services running, and delays non-critical AI training. It just saved '
  'thousands of litres in real time."')
cuep("Beat 3 — Cooling page")
q('"Here you can see exactly how the cooling reconfigures itself as water gets scarce."')
cuep("Beat 4 — The showstopper (turn Voice on, ask aloud)")
q('HYDRA, what should we do if a drought is coming?  (let it answer out loud)')
cuep("Beat 5 — Proof / compliance")
q('"And every decision generates a downloadable water audit report — continuous, transparent, '
  'regulator-ready."')
p("<b>Why it works:</b> you don\'t describe software — you create a mini-crisis on stage and show "
  "your product solve it live. Drama + control = memorable.")

# ---------- 5 Why now ----------
sec("5 &nbsp; WHY NOW / WHY US")
q('"Water regulations on data centers are tightening worldwide, and every major cloud and AI company '
  'has publicly committed to being water positive. They have targets but no operating system to hit '
  'them. We are that operating system."')

# ---------- 6 Business ----------
sec("6 &nbsp; MARKET &amp; BUSINESS MODEL")
p("We make money three ways:")
blist([
    "SaaS subscription per data center site",
    "Hardware + sensor installation",
    "Premium predictive analytics &amp; compliance reporting",
])
p("The data center cooling market is worth <b>[insert $ figure]</b>, and every new AI facility "
  "legally and reputationally needs us. <i>If you have any traction — a pilot, a letter of interest, "
  "an industry/college partner — say it here. Traction beats projections.</i>")

# ---------- 7 Ask ----------
sec("7 &nbsp; THE ASK &nbsp;(specific + confident)")
q('"We\'re asking for [amount] for [X]% equity. We\'ll use it to build our first commercial sensor '
  'kit, run a paid pilot with [target customer], and file our IP."')

# ---------- 8 Close ----------
sec("8 &nbsp; THE CLOSE &nbsp;(circle back to the hook)")
q('"Sharks, AI is here to stay — but our freshwater isn\'t guaranteed. HydroMind-X makes sure that as '
  'machines get smarter, they also get responsible. Because every AI decision should consider every '
  'drop of water. Who\'s ready to join us? Anbumathi, Shrenik, and Thamseel — Team AquaNova Trinity. '
  'Thank you."')

# ---------- Q&A ----------
sec("Q&amp;A &nbsp; PREP FOR THE HARD QUESTIONS")
qa = [
    ("Is this real or just a website?",
     "The dashboard is our live decision engine; the prototype runs on an ESP32 with real sensors. "
     "What you saw is the actual logic, not a mockup."),
    ("Who is your customer / who pays?",
     "Data center operators and cloud/AI companies first; later hospitals, universities, and smart-city campuses."),
    ("What is your moat?",
     "The Water Availability Index + adaptive decision engine + continuous audit trail. Data compounds — "
     "more sites make our predictions smarter."),
    ("Competition?",
     "Existing tools only monitor. We decide and act. We are a decision-support system, not a dashboard."),
    ("How do you make money at scale?",
     "Recurring SaaS per site + analytics upsell, with near-zero marginal cost per new customer."),
    ("You are students — why you?",
     "Because we saw this problem before the industry did, and we already built the working system you just watched."),
]
rows = [[Paragraph(f"<b>{q_}</b>", body), Paragraph(a_, body)] for q_, a_ in qa]
t = Table(rows, colWidths=[58*mm, 108*mm])
t.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor("#DDDDDD")),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 2),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(t)

# ---------- Delivery tips ----------
sec("DELIVERY TIPS TO WIN")
blist([
    "<b>Rehearse the demo until flawless</b> — pre-set your slider values; a frozen demo kills momentum.",
    "<b>Make eye contact on the hook and the ask</b> — those two moments decide the deal.",
    "<b>Speak in outcomes, not features</b> — \u201csaves X litres,\u201d not \u201cadjusts cooling parameters.\u201d",
    "<b>Show, don\u2019t tell</b> — the drought-slider moment is your winning card; milk the pause.",
    "<b>Know your one number cold</b> — the WAI. Repeat it: \u201c0 to 100.\u201d",
    "<b>End on the tagline every time</b> — \u201cEvery AI decision should consider every drop of water.\u201d",
])

hr(GREY, 0.6)
story.append(Paragraph(
    "HydroMind-X &bull; Team AquaNova Trinity &bull; Founder: Anbumathi Chezhian &bull; "
    "Co-Founders: Shrenik (Researcher), Thamseel Ahmed (Media File Manager)", small))

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm, topMargin=16*mm, bottomMargin=16*mm,
    title="HydroMind-X — Shark Tank Pitch Script", author="Team AquaNova Trinity",
)
doc.build(story)
print("PDF written to", OUT)
