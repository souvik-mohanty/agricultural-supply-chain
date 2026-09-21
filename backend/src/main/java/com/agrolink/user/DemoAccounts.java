package com.agrolink.user;

import java.util.List;

/**
 * The dummy accounts shown on the login page when demo mode is on. They are ordinary users with real (hashed)
 * passwords, so signing in goes through the normal login. The passwords are public on purpose.
 */
public final class DemoAccounts {

    public record Account(String username, String password, UserRole role, String description,
                          String contactNumber, String address) {
    }

    public static final List<Account> ALL = List.of(
            new Account("admin_demo", "Admin@123", UserRole.ADMIN,
                    "Manage users, roles, complaints and reports", "+91 90000 00001", "Head office, Pune"),
            new Account("manager_demo", "Manager@123", UserRole.MANAGER,
                    "Staff tools: warehouse and notifications", "+91 90000 00002", "Head office, Pune"),
            new Account("farmer_ravi", "Farmer@123", UserRole.FARMER,
                    "Lists produce and answers quote requests", "+91 90000 00003", "Nashik, Maharashtra"),
            new Account("farmer_meena", "Farmer@123", UserRole.FARMER,
                    "A second seller with their own products", "+91 90000 00004", "Karnal, Haryana"),
            new Account("buyer_asha", "Buyer@123", UserRole.BUYER,
                    "Browses, requests quotes, orders and pays", "+91 90000 00005", "Pune, Maharashtra"),
            new Account("buyer_kiran", "Buyer@123", UserRole.BUYER,
                    "A second buyer, to try quote requests between two people", "+91 90000 00006", "Mumbai, Maharashtra"),
            new Account("customer_demo", "Customer@123", UserRole.CUSTOMER,
                    "Same buying access as a buyer", "+91 90000 00007", "Nagpur, Maharashtra"),
            new Account("warehouse_demo", "Warehouse@123", UserRole.WAREHOUSE_OPERATOR,
                    "Stores crops and marks them ready for delivery", "+91 90000 00008", "Warehouse 4, Pune"),
            new Account("advisor_demo", "Advisor@123", UserRole.ADVISOR,
                    "Publishes articles and answers farmers' questions", "+91 90000 00009", "Agri centre, Nashik"),
            new Account("carrier_demo", "Carrier@123", UserRole.CARRIER,
                    "No shipment tools yet: only browsing and the profile", "+91 90000 00010", "Transport depot, Pune"));

    private DemoAccounts() {
    }
}
