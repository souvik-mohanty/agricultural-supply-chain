package com.agrolink.user;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
@Data
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    private String email;
    private String password;
    private String aadhar;
    private UserRole role;
    private String contactNumber;
    private String address;
    private boolean twoFactorEnabled;
    private boolean suspended;
}
