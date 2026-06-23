
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
   -- CONSTRAINT FK_TUser_OrganizationK FOREIGN KEY (OrganizationK) REFERENCES TOrganization(OrganizationK) ON DELETE SET NULL ON UPDATE CASCADE
);




-- Add three default containers, admin, user and guest
INSERT INTO TContainer (ContainerK, TypeC, FName, FSimpleName, FDatabase)
VALUES
    (1, 1, 'Admin Container', 'Admin', 'admin_db'),
    (2, 2, 'User Container', 'User', 'user_db'),
    (3, 3, 'Guest Container', 'Guest', 'guest_db');
