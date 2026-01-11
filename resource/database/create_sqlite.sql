
/* Used to group users and other items to a Container entity */
CREATE TABLE TContainer (
    ContainerK  INTEGER NOT NULL PRIMARY KEY,
    TypeC       INTEGER, -- Type of Container owner
    FName       VARCHAR(100),
    FSimpleName VARCHAR(100),
    FDatabase   VARCHAR(100)
);

/* Used to store user information */
CREATE TABLE TUser (
    UserK           BLOB PRIMARY KEY DEFAULT (hex(randomblob(16))),
    ContainerK      INTEGER NOT NULL,
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
);

CREATE INDEX I_TUser_ContainerK ON TUser(ContainerK);
CREATE INDEX I_TUser_FAlias      ON TUser(FAlias);
CREATE INDEX I_TUser_FDisplayName ON TUser(FDisplayName);


CREATE TABLE TPoll (
   PollK BLOB PRIMARY KEY DEFAULT (hex(randomblob(16))),
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
   ,FName TEXT              -- poll name
   ,FHeader TEXT            -- poll header
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
   PollSectionK BLOB PRIMARY KEY DEFAULT (hex(randomblob(16)))
   ,PollK BLOB
   ,SuperK BLOB             -- owner Poll section when used in hierarchical structure
   ,FIndex INTEGER          -- used to order sections
   ,FDescription TEXT
);
CREATE INDEX IC_TPoll_PollK ON TPollSection (PollK);

CREATE TABLE TPollComment (
   PollCommentK BLOB PRIMARY KEY DEFAULT (hex(randomblob(16)))
   ,PollK BLOB
   ,VoterK BLOB             -- Voter reference
   ,SuperK BLOB             -- owner Poll section when used in hierarchical structure
   ,CreateD DATETIME        -- when comment was created
   ,UpdateD DATETIME        -- last time comment was modified
   ,FormatS INTEGER         -- Comment format type
   ,TypeC INTEGER           -- Type of comment
   ,FText TEXT              -- Comment text
   ,FDeleted INTEGER DEFAULT 0 -- if poll is deleted
);
CREATE INDEX IC_TPollComment_PollK ON TPollComment (PollK);
CREATE INDEX I_TPollComment_VoterK ON TPollComment (VoterK);

/* Limits are used to set limits for the poll, like rules what for different questions */
CREATE TABLE TPollLimit (
   PollLimitK BLOB PRIMARY KEY DEFAULT (hex(randomblob(16)))
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
	PollQuestionK BLOB PRIMARY KEY DEFAULT (hex(randomblob(16)))
	,PollK BLOB
   ,SuperK BLOB             -- owner question when used in hierarchical structure
   ,PollSectionK BLOB
   ,CreateD DATETIME
   ,UpdateD DATETIME
   ,TypeC INTEGER           -- Type of question
   ,StateC INTEGER          -- State of question
   ,FName TEXT
   ,FLabel TEXT             -- Label may be used to inform voter about something, maybe hint about the comments
   ,FDescription TEXT
   ,FWeight INTEGER         -- Poll question weight, if different answers is weighted
   ,FOrder INTEGER          -- order question in poll
   ,CONSTRAINT FK_TPollQuestion_PollK FOREIGN KEY (PollK) REFERENCES TPoll(PollK) ON DELETE CASCADE
);
CREATE INDEX IC_TPollQuestion_PollK ON TPollQuestion (PollK);

CREATE TABLE TPollAnswer (
	PollAnswerK BLOB PRIMARY KEY DEFAULT (hex(randomblob(16)))
	,PollK BLOB
	,PollQuestionK BLOB
   ,SuperK BLOB             -- owner answer when used in hierarchical structure
   ,PollSectionK BLOB       -- When poll is divided in sections
   ,CreateD DATETIME
   ,UpdateD DATETIME
   ,TypeC INTEGER           -- Type of answer
   ,StateC INTEGER          -- State of answer
   ,FName TEXT              -- Answer name, this is used when answer is listed for voter to select
   ,FLabel TEXT             -- Label may be used to inform voter about something, maybe hint about the comments
   ,FDescription TEXT       -- Answer description if there is a need to describe
   ,FWeight INTEGER         -- If answer is weighted, how much weight this answer give the voter
   ,FScore REAL             -- If poll is a quiz or similar and you want to count points
   ,FCount INTEGER
   ,FOrder INTEGER          -- order answer for question
   ,CONSTRAINT FK_TPollAnswer_PollQuestionK FOREIGN KEY (PollQuestionK) REFERENCES TPollQuestion(PollQuestionK) ON DELETE CASCADE
);
CREATE INDEX IC_TPollAnswer_PollK ON TPollAnswer (PollK);
CREATE INDEX I_TPollAnswer_PollQuestionK ON TPollAnswer (PollQuestionK);
