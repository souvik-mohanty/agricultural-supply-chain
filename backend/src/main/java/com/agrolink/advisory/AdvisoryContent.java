package com.agrolink.advisory;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "advisory_contents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdvisoryContent {
    @Id
    private String id;
    private String advisorName;
    private String type; // blog, tip, video
    private String title;
    private String content;
    private String postedDate;
}
