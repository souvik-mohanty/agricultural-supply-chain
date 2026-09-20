package com.agrolink.admin;

import com.agrolink.user.dto.UserProfileDTO;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ReportService {

    private static final String[] HEADERS = {"Username", "Email", "Role", "Suspended"};

    public byte[] generatePdfReport(List<UserProfileDTO> users) throws IOException {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(output));
            Document document = new Document(pdf);

            document.add(new Paragraph("User Report").setBold().setFontSize(16));
            for (UserProfileDTO user : users) {
                document.add(new Paragraph(String.format("Username: %s | Email: %s | Role: %s%s",
                        user.username(), user.email(), user.role(), user.suspended() ? " | SUSPENDED" : "")));
            }

            document.close();
            return output.toByteArray();
        }
    }

    public byte[] generateExcelReport(List<UserProfileDTO> users) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Users");

            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                header.createCell(i).setCellValue(HEADERS[i]);
            }

            int rowNumber = 1;
            for (UserProfileDTO user : users) {
                Row row = sheet.createRow(rowNumber++);
                row.createCell(0).setCellValue(nullToEmpty(user.username()));
                row.createCell(1).setCellValue(nullToEmpty(user.email()));
                row.createCell(2).setCellValue(nullToEmpty(user.role()));
                row.createCell(3).setCellValue(user.suspended());
            }

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(output);
            return output.toByteArray();
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
