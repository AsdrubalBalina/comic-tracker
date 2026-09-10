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

    read_status VARCHAR(20)
        NOT NULL
        DEFAULT 'pending',

    rating SMALLINT,

    external_id INTEGER,
    external_source VARCHAR(50),

    description TEXT,
    store_date DATE,

    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_read_status
        CHECK (
            read_status IN (
                'pending',
                'reading',
                'read'
            )
        ),

    CONSTRAINT valid_rating
        CHECK (
            rating IS NULL
            OR rating BETWEEN 1 AND 5
        )
    
    CREATE UNIQUE INDEX unique_external_comic
    ON comics (external_source, external_id)
    WHERE external_id IS NOT NULL;

    CREATE TABLE creators (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        metron_id INTEGER UNIQUE
    );

    CREATE TABLE comic_creators (
    comic_id INTEGER NOT NULL
        REFERENCES comics(id)
        ON DELETE CASCADE,

    creator_id INTEGER NOT NULL
        REFERENCES creators(id)
        ON DELETE CASCADE,

    role VARCHAR(100) NOT NULL,

    PRIMARY KEY (
        comic_id,
        creator_id,
        role
        )
    );
)