# Build stage: compile and package the Spring Boot jar (tests are run in CI / locally, not on every deploy)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -q -B -DskipTests package

# Run stage: JRE only
FROM eclipse-temurin:21-jre
RUN useradd --system --create-home agrolink
WORKDIR /app
COPY --from=build /build/target/agrolink-*.jar app.jar
USER agrolink

# Sized for a 512 MB instance; raise MaxRAMPercentage on bigger ones.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC"

# The app listens on $PORT (Render sets it, 10000 by default) and falls back to 8080.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
