CREATE TABLE comics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    series VARCHAR(255),
    issue_number VARCHAR(50),
    publisher VARCHAR(100),
    main_character VARCHAR(100),
    writer VARCHAR(150),
    artist VARCHAR(150),
    cover_url VARCHAR(500),
    publication_year SMALLINT,
    read_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    rating SMALLINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_read_status
        CHECK (read_status IN ('pending', 'reading', 'read')),

    CONSTRAINT valid_rating
        CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);