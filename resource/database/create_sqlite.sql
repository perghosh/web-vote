/*
-- ## Delete all tables
-- Disable foreign keys temporarily
PRAGMA foreign_keys = OFF;

-- Get all tables and drop them
SELECT 'DROP TABLE IF EXISTS "' || name || '";'
FROM sqlite_master
WHERE type = 'table' AND name NOT LIKE 'sqlite_%';

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

*/



-- PRAGMA foreign_keys is required to enforce Foreign Key constraints in SQLite
PRAGMA foreign_keys = ON;

-- Each table gets a number
CREATE TABLE table_number (
   table_number_k INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
   number INTEGER,
   name VARCHAR(100) CHECK(length(name) < 100),
   description VARCHAR(250) CHECK(length(description) < 250)
);

-- CREATE TABLE TGroup, group codes
CREATE TABLE "TCodeGroup" (
    "CodeGroupK" INTEGER PRIMARY KEY NOT NULL
   ,"FName" VARCHAR(200) NOT NULL
   ,"FDescription" VARCHAR(250)
   ,"FLabel" VARCHAR(100)
   ,"FTable" VARCHAR(200)
   ,"FMainTable" VARCHAR(200)
   ,"FSchema" VARCHAR(50)
);

-- CREATE TABLE TBaseCode, base code is used to connect codes that has a common meaning.
CREATE TABLE "TCodeBase" (
   "CodeBaseK" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL
   ,"CodeGroupK" INTEGER NOT NULL                               -- fk to group
   ,"CreatedD" TEXT
   ,"UpdateD" TEXT
   ,"FId" INTEGER                                               -- Id used if there is a need to control numbers
   ,"FName" VARCHAR(200) NOT NULL
   ,"FAbbreviation" VARCHAR(100)                                -- Short name for code, could be used when codes are displayed in a breadcrumb trail
   ,"FDescription" VARCHAR(1000)
   ,"FRank" INTEGER                                             -- Ranking is for making system easier to work with, maybe you need parents in a tree but just some items are suitable for parents. Select those with codes that has some sort of ranking
   ,"FIdle" INTEGER DEFAULT 0
   ,"FDeleted" INTEGER DEFAULT 0
   ,CONSTRAINT "FK_TCodeBase_CodeGroupK" FOREIGN KEY ("CodeGroupK") REFERENCES "TCodeGroup"("CodeGroupK") ON DELETE CASCADE
);

CREATE INDEX "I_TCodeBase_CodeGroupK" ON "TCodeBase" ("CodeGroupK");

-- CREATE TABLE TCode, code is used as a lookup table for fields in other tables
CREATE TABLE "TCode" (
    "CodeK" INTEGER PRIMARY KEY AUTOINCREMENT
   ,"CodeGroupK" INTEGER NOT NULL            -- fk to group
   ,"CodeBaseK" INTEGER                      -- if connected to a common base code
   ,"SuperK" INTEGER                         -- parent code
   ,"CreatedD" TEXT
   ,"UpdateD" TEXT
   ,"FId" INTEGER                            -- Id used if there is a need to control numbers
   ,"FName" VARCHAR(200) NOT NULL            -- Name for code
   ,"FSystemName" VARCHAR(50)                -- Internal system name if needed
   ,"FAbbreviation" VARCHAR(100)             -- Short name for code, could be used when codes are displayed in a breadcrumb trail
   ,"FDescription" VARCHAR(250)              -- Describe the code, what is is suppose to be used for
   ,"FRank" INTEGER                          -- Ranking is for making system easier to work with, maybe you need parents in a tree but just some items are suitable for parents. Select those with codes that has some sort of ranking
   ,"FNotCompleted" INTEGER DEFAULT 0        -- Record needs more work
   ,"FIdle" INTEGER DEFAULT 0                -- Code is temporarily suspended
   ,"FDefault" INTEGER DEFAULT 0             -- Mark code as default, could be us to set this i no other code is selected
   ,"FDeleted" INTEGER DEFAULT 0             -- deleted but kept in database
   ,"FInteger0" INTEGER                      -- Custom integer
   ,"FInteger1" INTEGER                      -- Custom integer
   ,"FNumber0" REAL                          -- Custom number, could be used for anything that system is used for
   ,"FText0" VARCHAR(100)                    -- Custom text, used for anything thats appropriate to system
   ,CONSTRAINT "FK_TCode_CodeGroupK" FOREIGN KEY ("CodeGroupK") REFERENCES "TCodeGroup"("CodeGroupK") ON DELETE CASCADE
);

CREATE INDEX "I_TCode_CodeGroupK" ON "TCode" ("CodeGroupK");


/* Used to group users and other items to a Container entity */
CREATE TABLE TContainer (
    ContainerK  INTEGER NOT NULL PRIMARY KEY,
    TypeC       INTEGER, -- Type of Container owner
    FName       VARCHAR(100),
    FSimpleName VARCHAR(100),
    FDatabase   VARCHAR(100)
);

CREATE TABLE TOrganization (
   OrganizationK BLOB PRIMARY KEY DEFAULT (randomblob(16)),
   ParentK BLOB,                    -- Parent organization for hierarchical structure
   SuperK BLOB,                     -- Owner organization when used in hierarchical structure
   CreateD DATETIME,                -- when organization was created
   UpdateD DATETIME,                -- last time organization was updated
   TypeC INTEGER,                   -- Type of organization (e.g., company, department, team)
   StateC INTEGER,                  -- State of organization (active, inactive, etc.)
   ClassC INTEGER,                  -- Class/category of organization
   FName VARCHAR(500),              -- organization name
   FCode VARCHAR(100),              -- Short code/abbreviation for the organization
   FDescription TEXT,               -- describe organization
   FAddress TEXT,                   -- Physical address
   FPhone VARCHAR(50),              -- Contact phone
   FEmail VARCHAR(255),             -- Contact email
   FWebsite VARCHAR(255),           -- Website URL
   FTaxId VARCHAR(100),             -- Tax ID / Registration number
   FDeleted INTEGER DEFAULT 0       -- if organization is deleted
);

-- Indexes for foreign keys and common lookups
CREATE INDEX I_TOrganization_ParentK ON TOrganization (ParentK);
CREATE INDEX I_TOrganization_SuperK ON TOrganization (SuperK);

/* Used to store user information */
CREATE TABLE TUser (
    UserK           BLOB PRIMARY KEY DEFAULT (randomblob(16)),
    ContainerK      INTEGER NOT NULL,
    OrganizationK   BLOB,
    UserGroupK      INTEGER,
    CreateD         DATETIME,
    UpdateD         DATETIME,
    PermissionS     INTEGER,                             -- rights for this user
    CountryC        INTEGER,
    RoleC           INTEGER,
    FId             INTEGER,
    FAlias          VARCHAR(100),
    FLoginName      VARCHAR(100),
    FDisplayName    VARCHAR(100),
    FFirstName      VARCHAR(100),
    FLastName       VARCHAR(100),
    FDescription    VARCHAR(1000),
    FMail           VARCHAR(200),
    FMobile         VARCHAR(100),
    FLoginD         DATETIME,
    FLoginCount     INTEGER,
    FProfile        VARCHAR(100),
    FIdle           SMALLINT DEFAULT 0,
    FDeleted        SMALLINT DEFAULT 0,
    FPassword       VARCHAR(256),
    FLastLoginD     DATETIME,
    FLastIp         VARCHAR(100),

    -- Foreign Key
    CONSTRAINT FK_TUser_ContainerK FOREIGN KEY (ContainerK) REFERENCES TContainer(ContainerK) ON DELETE CASCADE ON UPDATE CASCADE
    -- CONSTRAINT FK_TUser_OrganizationK FOREIGN KEY (OrganizationK) REFERENCES TOrganization(OrganizationK) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX I_TUser_ContainerK ON TUser(ContainerK);
CREATE INDEX I_TUser_FAlias      ON TUser(FAlias);
CREATE INDEX I_TUser_FDisplayName ON TUser(FDisplayName);


CREATE TABLE TPoll (
   PollK BLOB PRIMARY KEY DEFAULT (randomblob(16)),
   PollGroupK INTEGER       -- main poll group that poll is connected to if any
   ,ParentK BLOB            -- if poll is connected to any other table compare to normal connection
   ,table_number INTEGER    -- Table number for describing what table TPoll belongs to
   ,SuperK BLOB             -- owner Poll when used in hierarchical structure
   ,UserK BLOB              -- user that has created this poll
   ,CreateD DATETIME        -- when poll was created
   ,UpdateD DATETIME        -- last time poll was updated
   ,TypeC INTEGER           -- Type of poll
   ,StateC INTEGER          -- State of poll
   ,ClassC INTEGER          -- Class of poll, could be some sort of quality, level or other type of division based on similar attribute
   ,ChartC INTEGER          -- How to present statistics
   ,DisplayC INTEGER        -- How to display this poll, may be used for some temporary settings on how this poll is promoted
   ,FName VARCHAR(500)      -- poll name
   ,FHeader VARCHAR(200)    -- poll header
   ,FDescription TEXT       -- describe poll
   ,FBegin DATETIME         -- begin date, when poll starts
   ,FEnd DATETIME           -- end date, when poll ends
   ,FRate REAL              -- If poll is weighted, then this can be used to calculate outcome FRate * TAnswer FWeight * TAnswer vote count
                            -- Using multiple questions in a poll, The vote for each voter may be estimated based on how voter has voted
                            -- in supporting questions and the weight they have based on answers.
                            -- A Yes/No question in sports, those that are trainers in that sport may have FWeight = 20, Athletes FWeight = 10, public has FWeight = 1
                            -- 1 trainer vote will then be like 20 public votes. FRate isn't needed but may be used to get better numbers in charts
   ,FCount INTEGER          -- may be used as a cache for vote count
   ,FDelay INTEGER          --
   ,FDelayVote REAL         -- Time to delay before vote is counted
   ,FWeight INTEGER         -- Poll weight is used for polls that are weighted.
   ,FUseTie INTEGER DEFAULT 1
   ,FDeleted INTEGER DEFAULT 0 -- if poll is deleted
);
CREATE INDEX "IC_TPoll_ParentK" ON TPoll (ParentK);
CREATE INDEX "I_TPoll_PollGroupK" ON TPoll (PollGroupK);

CREATE TABLE TPollSection (
   PollSectionK BLOB PRIMARY KEY DEFAULT (randomblob(16))
   ,PollK BLOB
   ,SuperK BLOB             -- owner Poll section when used in hierarchical structure
   ,FIndex INTEGER          -- used to order sections
   ,FDescription VARCHAR(100)
);
CREATE INDEX IC_TPoll_PollK ON TPollSection (PollK);

CREATE TABLE TPollComment (
   PollCommentK BLOB PRIMARY KEY DEFAULT (randomblob(16))
   ,PollK BLOB
   ,VoterK BLOB             -- Voter reference
   ,SuperK BLOB             -- owner Poll section when used in hierarchical structure
   ,CreateD DATETIME        -- when comment was created
   ,UpdateD DATETIME        -- last time comment was modified
   ,FormatS INTEGER         -- Comment format type
   ,TypeC INTEGER           -- Type of comment
   ,FText VARCHAR(2000)     -- Comment text
   ,FDeleted INTEGER DEFAULT 0 -- if poll is deleted
);
CREATE INDEX IC_TPollComment_PollK ON TPollComment (PollK);
CREATE INDEX I_TPollComment_VoterK ON TPollComment (VoterK);

/* Limits are used to set limits for the poll, like rules what for different questions */
CREATE TABLE TPollLimit (
   PollLimitK BLOB PRIMARY KEY DEFAULT (randomblob(16))
   ,PollK BLOB
   ,PollQuestionK BLOB
   ,UpdateD DATETIME
   ,limit_type INTEGER      -- limit type
   ,FDescription TEXT       -- Describe limit
   ,FLimitInteger INTEGER   -- Integer number for limit
   ,FLimitDecimal REAL      -- Decimal value for poll limit
   ,FLimitDate DATETIME     -- Date value for limit
   ,FLimitText TEXT         -- Text
   ,CONSTRAINT FK_TPollLimit_PollK FOREIGN KEY (PollK) REFERENCES TPoll(PollK)
   ,CONSTRAINT FK_TPollLimit_PollQuestionK FOREIGN KEY (PollQuestionK) REFERENCES TPollQuestion(PollQuestionK) ON DELETE CASCADE
);
CREATE INDEX IC_TPollLimit_PollK ON TPollLimit (PollK);
CREATE INDEX I_TPollLimit_PollQuestionK ON TPollLimit (PollQuestionK);

CREATE TABLE TPollQuestion (
	PollQuestionK BLOB PRIMARY KEY DEFAULT (randomblob(16))
	,PollK BLOB
   ,SuperK BLOB             -- owner question when used in hierarchical structure
   ,PollSectionK BLOB
   ,CreateD DATETIME
   ,UpdateD DATETIME
   ,TypeC INTEGER           -- Type of question
   ,StateC INTEGER          -- State of question
   ,FName VARCHAR(500)
   ,FLabel VARCHAR(100)     -- Label may be used to inform voter about something, maybe hint about the comments
   ,FDescription VARCHAR(2000)
   ,FWeight INTEGER         -- Poll question weight, if different answers is weighted
   ,FOrder INTEGER          -- order question in poll
   ,CONSTRAINT FK_TPollQuestion_PollK FOREIGN KEY (PollK) REFERENCES TPoll(PollK) ON DELETE CASCADE
);
CREATE INDEX IC_TPollQuestion_PollK ON TPollQuestion (PollK);

CREATE TABLE TPollAnswer (
	PollAnswerK BLOB PRIMARY KEY DEFAULT (randomblob(16))
	,PollK BLOB
	,PollQuestionK BLOB
   ,SuperK BLOB             -- owner answer when used in hierarchical structure
   ,PollSectionK BLOB       -- When poll is divided in sections
   ,CreateD DATETIME
   ,UpdateD DATETIME
   ,TypeC INTEGER           -- Type of answer
   ,StateC INTEGER          -- State of answer
   ,FName VARCHAR(500)      -- Answer name, this is used when answer is listed for voter to select
   ,FLabel VARCHAR(100)     -- Label may be used to inform voter about something, maybe hint about the comments
   ,FDescription TEXT       -- Answer description if there is a need to describe
   ,FWeight INTEGER         -- If answer is weighted, how much weight this answer give the voter
   ,FScore REAL             -- If poll is a quiz or similar and you want to count points
   ,FCount INTEGER
   ,FOrder INTEGER          -- order answer for question
   ,CONSTRAINT FK_TPollAnswer_PollQuestionK FOREIGN KEY (PollQuestionK) REFERENCES TPollQuestion(PollQuestionK) ON DELETE CASCADE
);
CREATE INDEX IC_TPollAnswer_PollK ON TPollAnswer (PollK);
CREATE INDEX I_TPollAnswer_PollQuestionK ON TPollAnswer (PollQuestionK);


-- Insert table numbers for all tables in the script
-- Starting at 1000, incrementing by 10 for each table

INSERT INTO table_number (number, name, description) VALUES (10, 'table_number', 'Stores table numbers for system tables');
INSERT INTO table_number (number, name, description) VALUES (101, 'TGroup', 'Group codes table');
INSERT INTO table_number (number, name, description) VALUES (102, 'TBaseCode', 'Base codes for common code meanings');
INSERT INTO table_number (number, name, description) VALUES (103, 'TCode', 'Lookup codes for fields in other tables');
INSERT INTO table_number (number, name, description) VALUES (200, 'TContainer', 'Groups users and items to a Container entity');
INSERT INTO table_number (number, name, description) VALUES (300, 'TOrganization', 'Organization table');
INSERT INTO table_number (number, name, description) VALUES (400, 'TUser', 'User information table');
INSERT INTO table_number (number, name, description) VALUES (1060, 'TPoll', 'Main poll table');
INSERT INTO table_number (number, name, description) VALUES (1070, 'TPollSection', 'Poll sections for organizing questions');
INSERT INTO table_number (number, name, description) VALUES (1080, 'TPollComment', 'Comments on polls');
INSERT INTO table_number (number, name, description) VALUES (1090, 'TPollLimit', 'Poll limits and rules');
INSERT INTO table_number (number, name, description) VALUES (1100, 'TPollQuestion', 'Poll questions table');
INSERT INTO table_number (number, name, description) VALUES (1110, 'TPollAnswer', 'Poll answers table');


-- TCodeGroup inserts for code groups
-- Using numbering scheme: 10, 20, 30 for existing tables, then 100+ for new tables
-- Format: CodeGroupK = (table_number from table_number table) + column offset
-- Column offsets: TypeC=1, StateC=2, ClassC=3, ChartC=4, DisplayC=5, etc.

-- TContainer codes (table_number 200)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (2001, 'TContainer.TypeC', 'Container type codes', 'TContainer', 'TContainer');

-- TOrganization codes (table_number 3001)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (3001, 'TOrganization.TypeC', 'Organization type codes (Company, Department, Team, etc.)', 'TOrganization', 'TOrganization'),
    (3002, 'TOrganization.StateC', 'Organization state codes (Active, Inactive, Suspended, etc.)', 'TOrganization', 'TOrganization'),
    (3003, 'TOrganization.ClassC', 'Organization class/category codes', 'TOrganization', 'TOrganization');

-- TUser codes (table_number 400)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (4001, 'TUser.CountryC', 'Country codes for users', 'TUser', 'TUser'),
    (4002, 'TUser.RoleC', 'User role codes (Admin, Manager, Employee, etc.)', 'TUser', 'TUser'),
    (4003, 'TUser.PermissionS', 'User permission level codes', 'TUser', 'TUser');

-- TPoll codes (table_number 1060)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (10601, 'TPoll.TypeC', 'Poll type codes (Survey, Quiz, Voting, etc.)', 'TPoll', 'TPoll'),
    (10602, 'TPoll.StateC', 'Poll state codes (Draft, Published, Closed, Archived, etc.)', 'TPoll', 'TPoll'),
    (10603, 'TPoll.ClassC', 'Poll class/category codes', 'TPoll', 'TPoll'),
    (10604, 'TPoll.ChartC', 'Poll chart presentation type codes', 'TPoll', 'TPoll'),
    (10605, 'TPoll.DisplayC', 'Poll display type codes', 'TPoll', 'TPoll');

-- TPollSection codes (table_number 1070)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (10701, 'TPollSection.TypeC', 'Poll section type codes', 'TPollSection', 'TPoll');

-- TPollComment codes (table_number 1080)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (10801, 'TPollComment.FormatS', 'Comment format type codes', 'TPollComment', 'TPoll'),
    (10802, 'TPollComment.TypeC', 'Comment type codes', 'TPollComment', 'TPoll');

-- TPollLimit codes (table_number 1090)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (10901, 'TPollLimit.limit_type', 'Poll limit type codes', 'TPollLimit', 'TPoll');

-- TPollQuestion codes (table_number 1100)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (11001, 'TPollQuestion.TypeC', 'Poll question type codes (Single choice, Multiple choice, Text, etc.)', 'TPollQuestion', 'TPoll'),
    (11002, 'TPollQuestion.StateC', 'Poll question state codes', 'TPollQuestion', 'TPoll');

-- TPollAnswer codes (table_number 1110)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (11101, 'TPollAnswer.TypeC', 'Poll answer type codes', 'TPollAnswer', 'TPoll'),
    (11102, 'TPollAnswer.StateC', 'Poll answer state codes', 'TPollAnswer', 'TPoll');

-- Insert a common/default organization with zero key
INSERT INTO TOrganization (OrganizationK,ParentK,SuperK,CreateD,UpdateD,TypeC,StateC,ClassC,FName,FCode,FDescription,FAddress,FPhone,FEmail,FWebsite,FTaxId,FDeleted)
VALUES (
   x'00000000000000000000000000000000',                 -- 16-byte zero key
   NULL,                                                -- No parent
   NULL,                                                -- No super
   datetime('now'),                                     -- Current date/time
   datetime('now'),                                     -- Current date/time
   0,                                                   -- Default type (e.g., 1 = Company)
   0,                                                   -- Default state (e.g., 1 = Active)
   0,                                                   -- Default class
   'Default Organization',                              -- Organization name
   'DEFAULT',                                           -- Organization code
   'System default organization for unassigned users',  -- Description
   NULL,                                                -- No address
   NULL,                                                -- No phone
   NULL,                                                -- No email
   NULL,                                                -- No website
   NULL,                                                -- No tax ID
   0                                                    -- Not deleted
);
