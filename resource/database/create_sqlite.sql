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

-- tie us used to connect votes that belongs together, for example when a voter votes for multiple questions in a poll, those votes can be connected with a tie, this can then be used to analyze how voters have voted across questions and maybe use this information to weight votes in some way.
CREATE TABLE tie (
   tie_k BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,FIp BLOB               -- IP address for tie, this can be used to block voters or analyze from where voters are coming from
   ,CreateD DATETIME DEFAULT CURRENT_TIMESTAMP-- when tie was created
);


-- =====================================================
-- SYSTEM TABLES (Internal use only - not for users/customers)
-- =====================================================

-- System Group table - for categorizing internal system codes
CREATE TABLE "TSystemCodeGroup" (
    "SystemCodeGroupK" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "FName" VARCHAR(100) NOT NULL,                    -- Internal system group name
    "FSystemName" VARCHAR(50) NOT NULL,               -- System identifier (e.g., 'STATE', 'FLAG', 'EVENT')
    "FDescription" VARCHAR(500)                       -- System description of what this group is for
);

-- System Code table - for internal system codes (not exposed to users)
CREATE TABLE "TSystemCode" (
    "SystemCodeK" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "SystemCodeGroupK" INTEGER NOT NULL,                  -- FK to TSystemCodeGroup
    "FId" INTEGER NOT NULL,                           -- Internal numeric identifier for the code
    "FName" VARCHAR(100) NOT NULL,                    -- Display name (internal use)
    "FDescription" VARCHAR(500),                      -- System description of what this code means
    "FValue" INTEGER,                                 -- Optional numeric value associated with code
    "FText" TEXT,                                     -- Optional text value associated with code
    "FIdle" INTEGER DEFAULT 0,                        -- Code is temporarily suspended
    "FDeleted" INTEGER DEFAULT 0,                     -- Deleted but kept in database
    CONSTRAINT "FK_TSystemCode_SystemCodeGroupK" FOREIGN KEY ("SystemCodeGroupK") REFERENCES "TSystemCodeGroup"("SystemCodeGroupK") ON DELETE CASCADE
);

CREATE INDEX "I_TSystemCode_SystemCodeGroupK" ON "TSystemCode" ("SystemCodeGroupK");
CREATE INDEX "I_TSystemCode_FName" ON "TSystemCode" ("FName");
CREATE INDEX "I_TSystemCode_FId" ON "TSystemCode" ("FId");

-- =====================================================
-- CODE TABLES (Used for user-defined codes and lookups, can be exposed to users) 
-- =====================================================

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

/* Used to group users into logical groups for permission and organization purposes */
CREATE TABLE TUserGroup (
    UserGroupK  BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,CreateD     DATETIME
   ,UpdateD     DATETIME
   ,FName       VARCHAR(100) NOT NULL-- Name of user group
   ,FDescription VARCHAR(500)        -- Description of what this group is for
   ,FIdle       INTEGER DEFAULT 0    -- Group is temporarily disabled
   ,FDeleted    INTEGER DEFAULT 0    -- Group is deleted but kept in database
);

CREATE INDEX I_TUserGroup_FName ON TUserGroup(FName);

CREATE TABLE TOrganization (
   OrganizationK BLOB PRIMARY KEY DEFAULT (randomblob(16))
   ,ParentK BLOB                    -- Parent organization for hierarchical structure
   ,SuperK BLOB                     -- Owner organization when used in hierarchical structure
   ,CreateD DATETIME                -- when organization was created
   ,UpdateD DATETIME                -- last time organization was updated
   ,TypeC INTEGER                   -- Type of organization (e.g., company, department, team)
   ,StateC INTEGER                  -- State of organization (active, inactive, etc.)
   ,ClassC INTEGER                  -- Class/category of organization
   ,FName VARCHAR(500)              -- organization name
   ,FCode VARCHAR(100)              -- Short code/abbreviation for the organization
   ,FDescription TEXT               -- describe organization
   ,FAddress TEXT                   -- Physical address
   ,FPhone VARCHAR(50)              -- Contact phone
   ,FEmail VARCHAR(255)             -- Contact email
   ,FWebsite VARCHAR(255)           -- Website URL
   ,FTaxId VARCHAR(100)             -- Tax ID / Registration number
   ,FDeleted INTEGER DEFAULT 0      -- if organization is deleted
);

-- Indexes for foreign keys and common lookups
CREATE INDEX I_TOrganization_ParentK ON TOrganization (ParentK);
CREATE INDEX I_TOrganization_SuperK ON TOrganization (SuperK);



/* Used to store user information */
CREATE TABLE TUser (
    UserK           BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,ContainerK      INTEGER NOT NULL
   ,OrganizationK   BLOB
   ,UserGroupK      BLOB
   ,CreateD         DATETIME
   ,UpdateD         DATETIME
   ,PermissionS     INTEGER                             -- rights for this user
   ,CountryC        INTEGER
   ,RoleC           INTEGER
   ,FId             INTEGER
   ,FAlias          VARCHAR(100)
   ,FLoginName      VARCHAR(100)
   ,FDisplayName    VARCHAR(100)
   ,FFirstName      VARCHAR(100)
   ,FLastName       VARCHAR(100)
   ,FDescription    VARCHAR(1000)
   ,FMail           VARCHAR(200)
   ,FMobile         VARCHAR(100)
   ,FLoginD         DATETIME
   ,FLoginCount     INTEGER
   ,FProfile        VARCHAR(100)
   ,FIdle           SMALLINT DEFAULT 0
   ,FDeleted        SMALLINT DEFAULT 0
   ,FPassword       VARCHAR(256)
   ,FLastLoginD     DATETIME
   ,FLastIp         VARCHAR(100)
   -- Foreign Key
   ,CONSTRAINT FK_TUser_ContainerK FOREIGN KEY (ContainerK) REFERENCES TContainer(ContainerK) ON DELETE CASCADE ON UPDATE CASCADE
   -- CONSTRAINT FK_TUser_OrganizationK FOREIGN KEY (OrganizationK) REFERENCES TOrganization(OrganizationK) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX I_TUser_ContainerK ON TUser(ContainerK);
CREATE INDEX I_TUser_FAlias      ON TUser(FAlias);
CREATE INDEX I_TUser_FDisplayName ON TUser(FDisplayName);

CREATE TABLE TVoter (
    VoterK BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,UserK BLOB
   ,CreateD         DATETIME DEFAULT CURRENT_TIMESTAMP
   ,UpdateD         DATETIME
   ,FIp             BLOB    -- IP address for voter, this can be used to block voters or analyze from where voters are coming from
   ,FUserAgent      VARCHAR(100) -- User agent string for tracking device/browser information
   ,FName           VARCHAR(100)
   ,FAlias          VARCHAR(100)
   ,FMail           VARCHAR(200)
   ,FMailHide BLOB
   ,FPassword BLOB
   ,FPhone          VARCHAR(100)
   ,FLastVote       DATETIME
   ,FDescription    VARCHAR(1000)  
   ,FUnlock         TEXT
   ,FValidated      INTEGER -- 0 = not validated, 1 = validated, 2 = blocked
   ,FDeleted        INTEGER DEFAULT 0
);

-- =====================================================
-- POLL TABLES  (Used for storing polls, questions, answers, votes, comments, limits, etc.) 
-- =====================================================

-- TPoll is the main table for storing poll information, this is the header for a poll and contains general information about the poll. 
CREATE TABLE TPoll (
   PollK BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,PollGroupK BLOB         -- main poll group that poll is connected to if any
   ,ParentK BLOB            -- if poll is connected to any other table compare to normal connection
   ,table_number INTEGER    -- Table number for describing what table TPoll belongs to
   ,SuperK BLOB             -- owner Poll when used in hierarchical structure
   ,UserK BLOB              -- user that has created this poll
   ,CreateD DATETIME DEFAULT CURRENT_TIMESTAMP-- when poll was created
   ,UpdateD DATETIME        -- last time poll was updated
   ,AreaC INTEGER           -- Area or domain this poll belongs to, this can be used to connect poll to a specific area or domain in the system
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
CREATE INDEX "I_TPoll_AreaC" ON TPoll (AreaC);

-- TPollSection is used to group polls in sections
CREATE TABLE TPollSection (
   PollSectionK BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,PollK BLOB
   ,SuperK BLOB             -- owner Poll section when used in hierarchical structure
   ,FIndex INTEGER          -- used to order sections
   ,FDescription VARCHAR(100)
);
CREATE INDEX IC_TPoll_PollK ON TPollSection (PollK);

-- Relation table between poll and sections, this is used to connect polls to sections, this is needed if a poll is connected to multiple sections or if there is a need to connect a section to multiple polls. This can then be used to list polls in different sections and also to connect questions and answers to specific sections.
CREATE TABLE rPollxSection (
   PollxSectionK BLOB PRIMARY KEY DEFAULT (randomblob(16))
   ,PollK BLOB
   ,PollSectionK BLOB
   ,PriorityC INTEGER       -- This can be used to set priority for relation to make some sort of ranking
   ,TypeC INTEGER           -- Type of relation for filter
   ,FDescription VARCHAR(100) -- Describe relation
);
CREATE INDEX IC_rPollxSection_PollK ON rPollxSection (PollK);

/* Used to store comments for polls, this can be used for discussions around the poll and also to get feedback from voters. Comments can be connected to a specific question or answer if needed by using SuperK and maybe some rules for how to use it. */
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
   ,FIp   BLOB              -- IP address

   ,FEdited INTEGER DEFAULT 0 -- Whether comment has been edited (0=no, 1=yes)
   ,FPinned INTEGER DEFAULT 0 -- Whether comment is pinned/sticky (moderator feature)   

   ,FUpVotes INTEGER DEFAULT 0 -- number of upvotes for comment, this can be used to sort comments based on score and also to block voters that are voting in a way that is not appropriate
   ,FDownVotes INTEGER DEFAULT 0 -- number of downvotes for comment 
   ,FScore INTEGER DEFAULT 0  -- (Upvotes - Downvotes) used for sorting

   ,FDeleted INTEGER DEFAULT 0 -- if poll is deleted
   ,CONSTRAINT FK_Comment_Poll FOREIGN KEY (PollK) REFERENCES TPoll(PollK) ON DELETE CASCADE
);
CREATE INDEX IC_TPollComment_PollK ON TPollComment (PollK);
CREATE INDEX I_TPollComment_VoterK ON TPollComment (VoterK);

/* Used to store votes for comments, this can be used to sort comments based on score and also to block voters that are voting in a way that is not appropriate */
CREATE TABLE TPollCommentVote (
    PollCommentVoteK BLOB PRIMARY KEY DEFAULT (randomblob(16))
    ,PollCommentK BLOB NOT NULL
    ,VoterK BLOB NOT NULL
    ,FValue INTEGER CHECK (FValue IN (1, -1)) -- 1 for upvote, -1 for downvote
    ,CreateD DATETIME DEFAULT CURRENT_TIMESTAMP
    ,CONSTRAINT FK_Vote_Comment FOREIGN KEY (PollCommentK) REFERENCES TPollComment(PollCommentK) ON DELETE CASCADE
    ,CONSTRAINT FK_Vote_Voter FOREIGN KEY (VoterK) REFERENCES TVoter(VoterK) ON DELETE CASCADE
);

CREATE TABLE TPollQuestion (
	PollQuestionK BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,PollK BLOB
   ,SuperK BLOB             -- owner question when used in hierarchical structure
   ,PollSectionK BLOB
   ,CreateD DATETIME
   ,UpdateD DATETIME
   ,TypeC INTEGER           -- Type of question
   ,StateC INTEGER          -- State of question
   ,FName VARCHAR(500)
   ,FQuestion VARCHAR(500)  -- Question text, this is used when question is listed for voter to select
   ,FQuestionMore TEXT      -- Question text if there is a need to describe question more in detail, this is used when voter has selected the question and is about to answer
   ,FLabel VARCHAR(100)     -- Label may be used to inform voter about something, maybe hint about the comments
   ,FDescription VARCHAR(2000)-- Describe question if there is a need to describe in some way
   ,FWeight INTEGER         -- Poll question weight, if different answers is weighted
   ,FOrder INTEGER          -- order question in poll
   ,FMaxSelect INTEGER DEFAULT 1 -- Max number of selectable answers for this question, 0 or null means no limit
   ,FMinSelect INTEGER DEFAULT 1 -- Min number of selectable answers for this question, 0 or null means no limit
   ,CONSTRAINT FK_TPollQuestion_PollK FOREIGN KEY (PollK) REFERENCES TPoll(PollK) ON DELETE CASCADE
);
CREATE INDEX IC_TPollQuestion_PollK ON TPollQuestion (PollK);

CREATE TABLE TPollAnswer (
	PollAnswerK BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,PollK BLOB
   ,PollQuestionK BLOB
   ,SuperK BLOB             -- owner answer when used in hierarchical structure
   ,PollSectionK BLOB       -- When poll is divided in sections
   ,CreateD DATETIME DEFAULT CURRENT_TIMESTAMP
   ,UpdateD DATETIME
   ,TypeC INTEGER           -- Type of answer
   ,StateC INTEGER          -- State of answer
   ,FName VARCHAR(500)      -- Answer name, this is used when answer is listed for voter to select
   ,FAnswer VARCHAR(500)    -- Answer text, this is used when answer is listed for voter to select
   ,FAnswerMore TEXT        -- Answer text if there is a need to describe answer more in detail, this is used when voter has selected the answer and is about to answer
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

-- Connect votes for polls that has multiple questions, this can then be used to analyze how voters have voted across questions
CREATE TABLE TPollTie (
   PollTieK BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,PollK BLOB             -- Poll reference, this is needed to connect votes to the right poll
   ,VoterK BLOB            -- Voter reference
   ,CreateD DATETIME DEFAULT CURRENT_TIMESTAMP-- when tie was created
   ,FIp BLOB               -- IP address for tie, this can be used to block voters or analyze from where voters are coming from
   ,FAgent VARCHAR(50)     -- User agent string for tracking device/browser information
   ,FLanguage VARCHAR(20)  -- Language for tie, this can be used to analyze from where voters are coming from
   ,FOs VARCHAR(50)        -- Operating system for tie, this can be used to analyze from where voters are coming from
   ,FDevice VARCHAR(50)    -- Device for tie, this can be used to analyze from where voters are coming from
   ,CONSTRAINT FK_TPollTie_PollK FOREIGN KEY (PollK) REFERENCES TPoll(PollK) ON DELETE CASCADE
);

CREATE INDEX I_TPollTie_PollK ON TPollTie (PollK);

/* Limits are used to set limits for the poll, like rules what for different questions */
CREATE TABLE TPollLimit (
   PollLimitK BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,PollK BLOB NOT NULL     -- Poll reference, this is needed to connect limits to the right poll
   ,PollQuestionK BLOB      -- if limit is connected to a specific question
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


CREATE TABLE IF NOT EXISTS TPollVote (
    PollVoteK BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16)),
    PollAnswerK   BLOB NOT NULL,
    VoterK        BLOB,                     -- Voter reference
    CreateD       DATETIME DEFAULT CURRENT_TIMESTAMP,
    TypeC         INTEGER,
    StateC        INTEGER,
    FSelect       INTEGER,                  -- Usually 1 if selected
    FWeight       INTEGER,                  -- Weight for weighted polls
    FIp           BLOB,                     -- IP address
    FComment      TEXT,                     -- Comment (max ~500 chars)
    verified      INTEGER,                  -- SMALLINT → INTEGER in SQLite
    FTie          BLOB,                     -- UNIQUEIDENTIFIER → TEXT (or BLOB)
    CONSTRAINT FK_TPollVote_PollAnswerK  FOREIGN KEY (PollAnswerK) REFERENCES TPollAnswer(PollAnswerK) ON DELETE CASCADE,
    CONSTRAINT FK_TPollVote_VoterK FOREIGN KEY (VoterK) REFERENCES TVoter(VoterK) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX I_TPollVote_PollQuestionK ON TPollVote (PollAnswerK);
CREATE INDEX I_TPollVote_FTie ON TPollVote (FTie);
CREATE INDEX I_TPollVote_FIp ON TPollVote (FIp);


CREATE TABLE TLink (
    LinkK           BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16)),

    CreateD         DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdateD         DATETIME,

    -- Polymorphic link to any record.
    table_number    INTEGER NOT NULL,           -- Reference to table_number.number
    FKey            BLOB NOT NULL,              -- Primary key of the record (for example, PollK, UserK, OrganizationK...)
    
    -- Link-specific fields
    FUrl            TEXT NOT NULL,              -- The actual link (can be http, https, mailto, tel, file:, etc.)
    FName           VARCHAR(300),               -- Display name / title of the link
    FDescription    TEXT,                       -- Description of what the link contains
    
    TypeC           INTEGER,                    -- Type of link (web, document, video, social media, API, etc.)
    CategoryC       INTEGER,                    -- Optional additional categorization
    
    FOrder          INTEGER DEFAULT 0,          -- Sort order when multiple links exist on the same record
    FTarget         VARCHAR(20) DEFAULT '_blank', -- _blank, _self, etc.
    
    FIdle           INTEGER DEFAULT 0,
    FDeleted        INTEGER DEFAULT 0
);

-- Indexes (very important for performance)
CREATE INDEX I_TLink_table_number_FKey ON TLink (table_number, FKey);
CREATE INDEX I_TLink_FUrl ON TLink (FUrl);
CREATE INDEX I_TLink_TypeC ON TLink (TypeC);
CREATE INDEX I_TLink_FOrder ON TLink (table_number, FKey, FOrder);


CREATE TABLE TImage (
    ImageK           BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16)),

    CreateD          DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdateD          DATETIME,

    table_number     INTEGER NOT NULL,          -- Reference to table_number.number
    FKey             BLOB NOT NULL,             -- Primary key of the owning record

    TypeC            INTEGER,                   -- Type of image (photo, logo, banner, thumbnail, icon, etc.)
    StateC           INTEGER,                   -- State of image
    CategoryC        INTEGER,                   -- Optional additional categorization

    FName            VARCHAR(300),              -- Display name / title
    FDescription     TEXT,                      -- Description of the image
    FAltText         VARCHAR(500),              -- Alt text for accessibility
    FFileName        VARCHAR(300),              -- Original file name
    FMimeType        VARCHAR(100),              -- image/jpeg, image/png, image/webp, etc.

    FUrl             TEXT,                      -- URL or relative path if file is stored outside the DB
    FPath            TEXT,                      -- Optional local/server path
    FData            BLOB,                      -- Binary image data if stored inside SQLite

    FWidth           INTEGER,                   -- Pixel width
    FHeight          INTEGER,                   -- Pixel height
    FSize            INTEGER,                   -- File size in bytes

    FChecksum        VARCHAR(128),              -- Optional hash for deduplication
    FIsPrimary       INTEGER DEFAULT 0,         -- Marks the main image for the owning record
    FOrder           INTEGER DEFAULT 0,         -- Sort order when multiple images exist

    FIdle            INTEGER DEFAULT 0,
    FDeleted         INTEGER DEFAULT 0
);

CREATE INDEX I_TImage_table_number_FKey ON TImage (table_number, FKey);
CREATE INDEX I_TImage_TypeC ON TImage (TypeC);
CREATE INDEX I_TImage_FIsPrimary ON TImage (table_number, FKey, FIsPrimary);
CREATE INDEX I_TImage_FOrder ON TImage (table_number, FKey, FOrder);
CREATE INDEX I_TImage_FChecksum ON TImage (FChecksum);


-- This table is the header for a thread
CREATE TABLE TThreadHeader (
    ThreadHeaderK BLOB NOT NULL
    ,ThreadK BLOB NOT NULL
    ,table_number INTEGER                   -- Links back to your table_number registry
    ,FNextId INTEGER NOT NULL DEFAULT 0     -- Used to keep track of comment counts or IDs within this thread
);

-- This table handles the "Reddit-style" nesting.
-- It stores the relationship and the "Path" to the comment.
CREATE TABLE TThread (
    ThreadHeaderK BLOB NOT NULL
    ,table_number INTEGER                   -- Links back to your table_number registry
    ,FKey BLOB                              -- The key of the item this thread entry is connected to (e.g., PollCommentK for comments, or other keys for different tables)
    ,FDepth INTEGER DEFAULT 0               -- How deep is the reply (0 = top level)
    ,FOrder INTEGER                         -- Used for ordering within a branch
    ,FPath VARCHAR(1024)                    -- Example: 'UUID1/UUID2/UUID3'
);

CREATE INDEX I_TThread_ThreadHeaderK ON TThread (ThreadHeaderK);
CREATE INDEX I_TThread_FPath ON TThread (FPath);

CREATE TABLE TFeedback (
    FeedbackK       BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16)),
    
    -- Who submitted the feedback
    VoterK          BLOB,                    -- Preferred for public/anonymous feedback
    UserK           BLOB,                    -- For logged-in/admin users

    CreateD         DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdateD         DATETIME,

    -- Metadata
    ResolvedD       DATETIME,                -- When it was resolved/closed
    ResolvedByUserK BLOB,                    -- Who resolved it (admin)

    -- Polymorphic association (very useful)
    table_number    INTEGER,                 -- e.g. link to a Poll, Question, Organization, etc.
    FKey            BLOB,                    -- The actual primary key of the related record
    
    -- Core content
    FTitle          VARCHAR(300) NOT NULL,   -- Short subject / title
    FDescription    TEXT NOT NULL,           -- Detailed feedback
    
    -- Classification
    TypeC           INTEGER,                 -- Suggestion, Bug, Feature Request, Complaint, Praise, Other...
    StateC          INTEGER,                 -- New, In Review, Accepted, Rejected, Implemented, Closed...
    PriorityC       INTEGER,                 -- Low, Medium, High, Critical
    SeverityC       INTEGER,                 -- Optional: Minor, Major, Critical (especially for bugs)
    
    
    -- Additional useful fields
    FExpectedResult TEXT,                    -- For bugs/suggestions: what did you expect?
    FActualResult   TEXT,                    -- For bugs: what happened instead?
    FReproduceSteps TEXT,                    -- Reproduction steps for bugs
    FVersion        VARCHAR(100),            -- App version, poll version, etc.
    FBrowser        VARCHAR(100),            -- Or device info if not using Voter table
    FIp             BLOB,
    
    -- Status flags
    FIdle           INTEGER DEFAULT 0,
    FDeleted        INTEGER DEFAULT 0,
    FPinned         INTEGER DEFAULT 0,       -- For important feedback visible to admins
    
    -- Foreign Keys
    CONSTRAINT FK_TFeedback_VoterK FOREIGN KEY (VoterK) REFERENCES TVoter(VoterK) ON DELETE SET NULL,
    CONSTRAINT FK_TFeedback_UserK FOREIGN KEY (UserK) REFERENCES TUser(UserK) ON DELETE SET NULL,
    CONSTRAINT FK_TFeedback_ResolvedBy FOREIGN KEY (ResolvedByUserK) REFERENCES TUser(UserK) ON DELETE SET NULL
);


CREATE TABLE "TSystemStatement" (
    "SystemStatementK" INTEGER PRIMARY KEY AUTOINCREMENT
    ,"FName" VARCHAR(200) NOT NULL
    ,"FDescription" VARCHAR(250)
    ,"FStatement" TEXT
    ,"FType" INTEGER
    ,"FTable" VARCHAR(200)
);

-- Generate insert statements for TSystemStatement





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
INSERT INTO table_number (number, name, description) VALUES (1120, 'TPollTie', 'Connect votes for polls with multiple questions');
INSERT INTO table_number (number, name, description) VALUES (1130, 'TPollVote', 'Votes for poll answers');
INSERT INTO table_number (number, name, description) VALUES (1200, 'TLink', 'Table for storing links related to any record');
INSERT INTO table_number (number, name, description) VALUES (1300, 'TImage', 'Table for storing images related to any record');
INSERT INTO table_number (number, name, description) VALUES (1400, 'TThreadHeader', 'Table for storing thread headers for nested comments');
INSERT INTO table_number (number, name, description) VALUES (1410, 'TThread', 'Table for storing thread entries for nested comments');
INSERT INTO table_number (number, name, description) VALUES (1420, 'TFeedback', 'Table for storing user feedback, suggestions, and bug reports');
INSERT INTO table_number (number, name, description) VALUES (1500, 'TSystemStatement', 'Table for storing predefined system statements');


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
    (10601, 'TPoll.AreaC', 'Poll area codes (Survey, Quiz, Voting, etc.)', 'TPoll', 'TPoll'),
    (10602, 'TPoll.TypeC', 'Poll type codes (Survey, Quiz, Voting, etc.)', 'TPoll', 'TPoll'),
    (10603, 'TPoll.StateC', 'Poll state codes (Draft, Published, Closed, Archived, etc.)', 'TPoll', 'TPoll'),
    (10604, 'TPoll.ClassC', 'Poll class/category codes', 'TPoll', 'TPoll'),
    (10605, 'TPoll.ChartC', 'Poll chart presentation type codes', 'TPoll', 'TPoll'),
    (10606, 'TPoll.DisplayC', 'Poll display type codes', 'TPoll', 'TPoll');

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

-- TPollVote codes (table_number 1130)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (11301, 'TPollVote.TypeC', 'Poll vote type codes', 'TPollVote', 'TPoll'),
    (11302, 'TPollVote.StateC', 'Poll vote state codes', 'TPollVote', 'TPoll');    

-- TLink codes (table_number 1200)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (12001, 'TLink.TypeC', 'Link type codes (Web, Document, Video, Social Media, API, etc.)', 'TLink', 'TLink'),
    (12002, 'TLink.CategoryC', 'Link category codes', 'TLink', 'TLink');

-- TImage codes (table_number 1300)
INSERT INTO TCodeGroup (CodeGroupK, FName, FDescription, FTable, FMainTable) VALUES
    (13001, 'TImage.TypeC', 'Image type codes (Photo, Logo, Banner, Thumbnail, Icon, etc.)', 'TImage', 'TImage'),
    (13002, 'TImage.StateC', 'Image state codes', 'TImage', 'TImage'),
    (13003, 'TImage.CategoryC', 'Image category codes', 'TImage', 'TImage');    

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
