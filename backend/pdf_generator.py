from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import datetime

def generate_pdf(data: dict, output_path: str):
    doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('T', parent=styles['Title'], fontSize=20, textColor=colors.HexColor('#1a1a2e'), spaceAfter=6, alignment=TA_CENTER, fontName='Helvetica-Bold')
    sub_style = ParagraphStyle('S', parent=styles['Normal'], fontSize=11, textColor=colors.HexColor('#4a4a6a'), spaceAfter=4, alignment=TA_CENTER)
    q_style = ParagraphStyle('Q', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#1a1a2e'), spaceAfter=4, leading=16)
    opt_style = ParagraphStyle('O', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#333355'), leftIndent=20, spaceAfter=2)
    ans_style = ParagraphStyle('A', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#006600'), leftIndent=10, spaceAfter=2, fontName='Helvetica-Bold')
    meta_style = ParagraphStyle('M', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#555577'), leftIndent=10, spaceAfter=4, fontName='Helvetica-Oblique')

    story = []
    story.append(Paragraph("QUESTION PAPER", title_style))
    story.append(Paragraph("AI-Generated — QPGen", sub_style))
    story.append(Spacer(1, 0.3*cm))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2d2d5e')))
    story.append(Spacer(1, 0.3*cm))

    questions = data.get("questions", [])
    total_marks = sum(q.get("marks", 1) for q in questions)
    now = datetime.datetime.now().strftime("%B %d, %Y")
    info_data = [["Date:", now, "Total Questions:", str(len(questions))], ["Total Marks:", str(total_marks), "Duration:", "As per instructor"]]
    info_table = Table(info_data, colWidths=[3*cm, 6*cm, 4*cm, 4*cm])
    info_table.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'Helvetica'),('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('FONTNAME',(2,0),(2,-1),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3)]))
    story.append(info_table)
    story.append(Spacer(1, 0.4*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#ccccdd')))
    story.append(Spacer(1, 0.4*cm))

    if data.get("summary"):
        story.append(Paragraph("<b>Summary:</b>", q_style))
        story.append(Paragraph(data["summary"], meta_style))
        story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("QUESTIONS", title_style))
    story.append(Spacer(1, 0.3*cm))
    for i, q in enumerate(questions, 1):
        story.append(Paragraph(f"[{q.get('type','').upper()}] [{q.get('bloom_level','')}] [{q.get('difficulty','').upper()}] [{q.get('marks',1)} Mark(s)]", meta_style))
        story.append(Paragraph(f"<b>Q{i}.</b> {q['question']}", q_style))
        if q.get("options"):
            for opt in q["options"]: story.append(Paragraph(opt, opt_style))
        story.append(Spacer(1, 0.5*cm))

    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2d2d5e')))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("ANSWER KEY", title_style))
    story.append(Spacer(1, 0.3*cm))
    for i, q in enumerate(questions, 1):
        story.append(Paragraph(f"<b>Q{i}.</b> {q['question'][:80]}...", q_style))
        story.append(Paragraph(f"Answer: {q.get('answer','N/A')}", ans_style))
        if q.get("explanation"): story.append(Paragraph(f"Explanation: {q['explanation']}", meta_style))
        story.append(Spacer(1, 0.3*cm))

    doc.build(story)
    return output_path
