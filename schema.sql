-- =============================================================================
-- Society Maintenance Tracker - PostgreSQL DDL Schema
-- =============================================================================

-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'RESIDENT');
CREATE TYPE complaint_category AS ENUM ('PLUMBING', 'ELECTRICAL', 'CARPENTRY', 'CLEANLINESS', 'SECURITY', 'OTHER');
CREATE TYPE complaint_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE complaint_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'RESIDENT',
    flat_no VARCHAR(50),
    phone_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. Complaints Table
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category complaint_category NOT NULL,
    priority complaint_priority NOT NULL DEFAULT 'MEDIUM',
    status complaint_status NOT NULL DEFAULT 'OPEN',
    photo_url VARCHAR(500),
    resident_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_complaints_resident_id ON complaints(resident_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);

-- 3. Complaint Status History Table
CREATE TABLE complaint_status_history (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    from_status complaint_status,
    to_status complaint_status NOT NULL,
    note TEXT,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_csh_complaint_id ON complaint_status_history(complaint_id);
CREATE INDEX idx_csh_changed_by ON complaint_status_history(changed_by);
CREATE INDEX idx_csh_changed_at ON complaint_status_history(changed_at);

-- 4. Notices Table
CREATE TABLE notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_important BOOLEAN NOT NULL DEFAULT FALSE,
    posted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notices_posted_by ON notices(posted_by);
CREATE INDEX idx_notices_listing ON notices(is_important DESC, created_at DESC);

-- 5. Settings Table
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
