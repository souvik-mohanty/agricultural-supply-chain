package com.agrolink.order;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/** Order ids look like {@code 20250131T142501-aB3d...}: 36 characters, so they also fit Razorpay's 40 character receipt limit. */
@Component
public class NanoIdGenerator {

    private static final char[] ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int ID_LENGTH = 20;
    private static final DateTimeFormatter PREFIX_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

    public String generateOrderId() {
        return LocalDateTime.now().format(PREFIX_FORMAT) + "-" + NanoIdUtils.randomNanoId(RANDOM, ALPHABET, ID_LENGTH);
    }
}
