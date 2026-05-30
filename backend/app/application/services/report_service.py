from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def build_report_pdf(title: str, lines: list[str]) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    pdf.setFont('Helvetica-Bold', 14)
    pdf.drawString(40, height - 50, title)

    pdf.setFont('Helvetica', 10)
    y = height - 80
    for line in lines:
        pdf.drawString(40, y, line)
        y -= 16
        if y < 50:
            pdf.showPage()
            pdf.setFont('Helvetica', 10)
            y = height - 50

    pdf.save()
    buffer.seek(0)
    return buffer.read()
