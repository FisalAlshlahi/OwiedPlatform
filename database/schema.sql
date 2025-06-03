-- جدول المستخدمين
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('student', 'supervisor')) NOT NULL
);

-- جدول المشرفين
CREATE TABLE Supervisors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id)
);

-- جدول الطلاب
CREATE TABLE Students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id),
    supervisor_id INTEGER REFERENCES Supervisors(id)
);

-- جدول Core EPAs
CREATE TABLE CoreEPAs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- جدول الأنشطة
CREATE TABLE Activities (
    id SERIAL PRIMARY KEY,
    core_epa_id INTEGER REFERENCES CoreEPAs(id),
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- جدول السلوكيات
CREATE TABLE Behaviors (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES Activities(id),
    description TEXT NOT NULL
);

-- جدول التقييمات
CREATE TABLE Evaluations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES Students(id),
    behavior_id INTEGER REFERENCES Behaviors(id),
    is_met BOOLEAN NOT NULL,
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- جدول Smaller EPAs
CREATE TABLE SmallerEPAs (
    id SERIAL PRIMARY KEY,
    core_epa_id INTEGER REFERENCES CoreEPAs(id),
    name VARCHAR(255) NOT NULL,
    description TEXT
);



-- جدول Smaller EPAs
CREATE TABLE SmallerEPAs (
    id SERIAL PRIMARY KEY,
    core_epa_id INTEGER REFERENCES CoreEPAs(id),
    name VARCHAR(255) NOT NULL,
    description TEXT
);
