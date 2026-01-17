
## table_number
```sql
-- Each table gets a number
CREATE TABLE table_number (
   table_number_k INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
   number INTEGER,
   name VARCHAR(100) CHECK(length(name) < 100),
   description VARCHAR(250) CHECK(length(description) < 250)
);
```

```sql
```
INSERT INTO table_number (number, name, description) VALUES ({number}, {name}, {description})

INSERT INTO table_number (number, name, description)
VALUES (2, 'Visitors', 'Guest Access');


## Vote codes
```

```
INSERT INTO TGroup (GroupK, FName, FDescription, FLabel, FTable, FMainTable, FSchema)
VALUES (2, 'Guests', NULL, 'Guest Access', 'Visitors', 'Contacts', NULL);

INSERT INTO TGroup (GroupK, FName, FDescription, FLabel, FTable, FMainTable, FSchema)
VALUES (3, 'Admins', NULL, 'Admin Access', 'TVote', 'TVote', NULL);
