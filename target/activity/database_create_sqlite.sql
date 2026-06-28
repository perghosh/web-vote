
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
   ,CONSTRAINT FK_TUser_UserGroupK FOREIGN KEY (UserGroupK) REFERENCES TUserGroup(UserGroupK) ON DELETE SET NULL ON UPDATE CASCADE
   ,CONSTRAINT FK_TUser_OrganizationK FOREIGN KEY (OrganizationK) REFERENCES TOrganization(OrganizationK) ON DELETE SET NULL ON UPDATE CASCADE
);





/* Activities connected to different items in changelog */
CREATE TABLE "TActivity" (
    "ActivityK" BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
    ,"SuperK" BLOB                                 -- owner TActivity when used in hierarchical structure
    ,"ParentK" BLOB NOT NULL
    ,"table_number" INTEGER                        -- Table number for describing what table activity belongs to
    ,"UserK" BLOB                                  -- responsible user
    ,"User2K" BLOB                                 -- second user
    ,"CreateD" DATETIME
    ,"UpdateD" DATETIME
    ,"ColorS" INTEGER                              -- for color coding
    ,"AliveS" INTEGER                              -- active, closed, deleted
    ,"TypeC" INTEGER                               -- type code
    ,"PriorityC" INTEGER                           -- priority code
    ,"StateC" INTEGER                              -- activity state code
    ,"ServiceC" INTEGER                            -- used for mark if activity is some sort of service, like consultation and can be used to calculate price
    ,"AreaC" INTEGER                               -- area where activity belongs to, could be e.g. sales, development, administration
    ,"FormC" INTEGER                               -- form (format) could be code language if programming task
    ,"LevelC" INTEGER                              -- level (difficulty) for activity, useful when activity has a lot of text.
    ,"ContextC" INTEGER                            -- In what context this activity is for
    ,"ReportC" INTEGER                             -- if activity is used in some type of reporting, could be used as who gets the report
    ,"FDescription" VARCHAR(1000)                  -- Activity description, use this for hashtags
    ,"FBeginD" DATETIME                            -- activity start
    ,"FEndD" DATETIME                              -- activity end
    ,"FAlertD" DATETIME                            -- alert time
    ,"FDeadlineD" DATETIME                         -- deadline time
    ,"FDoneD" DATETIME                             -- date when activity was done
    ,"FTimeSpent" REAL                             -- time spent on activity
    ,"FTimeEstimated" REAL                         -- estimated time
    ,"FTimeActual" REAL                            -- actual time spent
    ,"FAmount" REAL                                -- amount associated with activity
    ,"FFromUser" BLOB                              -- if user sent activity to another user
    ,"FToUser" BLOB                                -- to user if activity was sent (like mail)
    ,"FSort" INTEGER                               -- Helper field that could be use for custom sorting
    ,"FDone" SMALLINT DEFAULT 0                    -- Mark that activity is done
    ,"FDeleted" SMALLINT DEFAULT 0                 -- Delete activity but keep it in database
);

CREATE INDEX "application.IC_TActivity_ParentK" ON "TActivity" ("ParentK");
CREATE INDEX "application.I_TActivity_UserK" ON "TActivity" ("UserK");
CREATE INDEX "application.I_TActivity_TypeC" ON "TActivity" ("TypeC");
CREATE INDEX "application.I_TActivity_FBeginD" ON "TActivity" ("FBeginD");


/* Systems connected to different changelog scopes */
CREATE TABLE "TSystem" (
    "SystemK" BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,"GlobalK" BLOB
   ,"SuperK" BLOB                                  -- owner TSystem when used in hierarchical structure
   ,"UserK" BLOB                                   -- responsible user
   ,"CreateD" DATETIME
   ,"UpdateD" DATETIME
   ,"TypeC" INTEGER                                -- Type of system, application dependent
   ,"StateC" INTEGER                               -- State system is in, application dependent
   ,"PriorityC" INTEGER                            -- Priority for system
   ,"AreaC" INTEGER                                -- area system belongs to, could be areas in the organization
   ,"FName" VARCHAR(100)
   ,"FAbbreviation" VARCHAR(100)                   -- abbreviation for system, sometimes a short name is needed
   ,"FDescription" VARCHAR(1000)
   ,"FIdle" SMALLINT DEFAULT 0
   ,"FDeleted" SMALLINT DEFAULT 0
);

CREATE INDEX "application.IC_TSystem_GlobalK" ON "TSystem" ("GlobalK");


/* Projects connected to different changelog scopes */
CREATE TABLE "TProject" (
    "ProjectK" BLOB NOT NULL PRIMARY KEY DEFAULT (randomblob(16))
   ,"GlobalK" BLOB
   ,"CustomerChapterK" BLOB                        -- Use this to create navigation trees
   ,"SuperK" BLOB                                  -- owner TProject when used in hierarchical structure
   ,"ParentK" BLOB
   ,"table_number" INTEGER                         -- Table number for describing what table note belongs to
   ,"UserK" BLOB                                   -- responsible user
   ,"CreateD" DATETIME
   ,"UpdateD" DATETIME
   ,"TypeC" INTEGER                                -- Type of project
   ,"StateC" INTEGER                               -- Some sort of project status
   ,"AreaC" INTEGER                                -- area where project belongs to, could be e.g. sales, development, administration
   ,"PriorityC" INTEGER DEFAULT 0                  -- Priority for project
   ,"FName" VARCHAR(500)
   ,"FDescription" VARCHAR(1000)
   ,"FText0" VARCHAR(100)
   ,"FText1" VARCHAR(100)
   ,"FBeginD" DATETIME                             -- project start
   ,"FEndD" DATETIME                               -- project end
   ,"FDeadlineD" DATETIME                          -- deadline time
   ,"FTodo" SMALLINT DEFAULT 0
   ,"FDone" SMALLINT DEFAULT 0                     -- Project is ready
   ,"FPrivate" SMALLINT DEFAULT 0                  -- Mark project as private, only those related can view it
   ,"FDeleted" SMALLINT DEFAULT 0
);

CREATE INDEX "application.IC_TProject_ParentK" ON "TProject" ("ParentK");
CREATE INDEX "application.I_TProject_GlobalK" ON "TProject" ("GlobalK");
CREATE INDEX "application.I_TProject_FStartD" ON "TProject" ("FBeginD");
CREATE INDEX "application.I_TProject_StateC" ON "TProject" ("StateC");


-- Add three default containers, admin, user and guest
INSERT INTO TContainer (ContainerK, TypeC, FName, FSimpleName, FDatabase)
VALUES
    (1, 1, 'Admin Container', 'Admin', 'admin_db'),
    (2, 2, 'User Container', 'User', 'user_db'),
    (3, 3, 'Guest Container', 'Guest', 'guest_db');
