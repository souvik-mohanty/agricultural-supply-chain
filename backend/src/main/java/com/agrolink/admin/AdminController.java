package com.agrolink.admin;

import com.agrolink.user.UserService;
import com.agrolink.user.dto.RoleChangeRequest;
import com.agrolink.user.dto.UserProfileDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

/** Everything under /api/admin requires the ADMIN role (enforced in SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final ComplaintService complaintService;
    private final ReportService reportService;

    @GetMapping("/users")
    public List<UserProfileDTO> getAllUsers() {
        return userService.listAll();
    }

    @PostMapping("/suspend/{id}")
    public ResponseEntity<String> suspendUser(@PathVariable String id) {
        userService.setSuspended(id, true);
        return ResponseEntity.ok("User suspended");
    }

    @PostMapping("/unsuspend/{id}")
    public ResponseEntity<String> unsuspendUser(@PathVariable String id) {
        userService.setSuspended(id, false);
        return ResponseEntity.ok("User reinstated");
    }

    @PutMapping("/users/{id}/role")
    public UserProfileDTO changeRole(@PathVariable String id, @Valid @RequestBody RoleChangeRequest request) {
        return userService.changeRole(id, request.role());
    }

    @GetMapping("/complaints")
    public List<Complaint> getComplaints() {
        return complaintService.getAll();
    }

    @PostMapping("/complaints/{id}/resolve")
    public ResponseEntity<String> resolveComplaint(@PathVariable String id) {
        complaintService.resolve(id);
        return ResponseEntity.ok("Complaint resolved");
    }

    @GetMapping("/report/pdf")
    public ResponseEntity<byte[]> getPdfReport() throws IOException {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report.pdf")
                .body(reportService.generatePdfReport(userService.listAll()));
    }

    @GetMapping("/report/excel")
    public ResponseEntity<byte[]> getExcelReport() throws IOException {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report.xlsx")
                .body(reportService.generateExcelReport(userService.listAll()));
    }
}
