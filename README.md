# Online Equipment Borrowing and Return Monitoring System

## Laboratory Exercise 3 – Systems Analysis and Design

An **Online Equipment Borrowing and Return Monitoring System** is a web-based information system designed to manage college equipment borrowing and returning transactions.

The system helps monitor equipment availability, borrower information, due dates, returned equipment, and overdue transactions. It replaces manual recording with a centralized online database.

---

## Project Information

**Project Title:** Online Equipment Borrowing and Return Monitoring System
**Course:** Systems Analysis and Design
**Level:** Intermediate Software Development
**Development Type:** Individual Laboratory Exercise

---

## Technologies Used

* HTML
* CSS
* JavaScript
* Supabase PostgreSQL
* Supabase Authentication
* GitHub
* GitHub Pages

---

## Main Features

### 1. User Authentication

* User login using email and password
* Authentication using Supabase Auth
* Session checking
* Logout functionality

### 2. Dashboard

The dashboard displays:

* Total Equipment
* Available Equipment
* Borrowed Equipment
* Returned Transactions
* Overdue Transactions

### 3. Equipment Management

The system supports CRUD operations:

* Add Equipment
* View Equipment
* Edit Equipment
* Delete Equipment
* Search Equipment

Each equipment record contains:

* Equipment Name
* Category
* Asset Code
* Condition
* Availability

### 4. Borrowing Transactions

Users can record equipment borrowing information including:

* Equipment
* Borrower Name
* Borrower Type
* Department
* Date Borrowed
* Due Date

### 5. Return Equipment

The system allows users to:

* Record equipment return
* Set the return date
* Update transaction status to Returned
* Automatically make the equipment Available again

### 6. Overdue Detection

The system automatically identifies borrowed equipment whose due date has already passed.

The transaction status is changed to:

**Overdue**

### 7. Search and Filter

Users can search equipment and borrowing transactions using the available search and filter functions.

---

## Database

The system uses **Supabase PostgreSQL** as its backend database.

### Equipment Table

| Field          | Description           |
| -------------- | --------------------- |
| id             | Unique equipment ID   |
| equipment_name | Name of the equipment |
| category       | Equipment category    |
| asset_code     | Unique asset code     |
| condition      | Equipment condition   |
| availability   | Available or Borrowed |
| created_at     | Date and time created |

### Borrow Transactions Table

| Field         | Description                    |
| ------------- | ------------------------------ |
| id            | Unique transaction ID          |
| equipment_id  | Reference to equipment         |
| borrower_name | Name of borrower               |
| borrower_type | Student, Faculty, or Staff     |
| department    | Borrower's department          |
| date_borrowed | Date equipment was borrowed    |
| due_date      | Expected return date           |
| date_returned | Actual return date             |
| status        | Borrowed, Returned, or Overdue |
| user_id       | Authenticated user ID          |
| created_at    | Date and time created          |

---

## Database Relationship

The system uses a **one-to-many relationship**:

**Equipment (1) → Borrow Transactions (Many)**

One equipment item can have many borrowing transaction records over time.

---

## Business Rules

1. Equipment name must not be empty.
2. Asset code must be unique.
3. Only available equipment can be borrowed.
4. Borrower name is required.
5. Due date must not be earlier than the borrowing date.
6. Newly borrowed equipment is marked as **Borrowed**.
7. Borrowed equipment becomes unavailable.
8. Returned equipment becomes available again.
9. Equipment past its due date is identified as **Overdue**.
10. Equipment deletion requires confirmation.
11. Only authenticated users can manage records.
12. A returned transaction cannot be returned twice.

---

## Project Structure

```text
SAD-EquipmentBorrowing-Lastname/
│
├── index.html
├── login.html
├── equipment.html
├── transactions.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── supabase.js
│   ├── equipment.js
│   └── transactions.js
│
├── documentation/
│   ├── use-case.png
│   └── erd.png
│
└── README.md
```

---

## How to Run the System

### 1. Open the Login Page

Open:

```text
login.html
```

### 2. Login

Use the registered Supabase account.

### 3. Dashboard

After successful login, the system displays the equipment and transaction summary.

### 4. Manage Equipment

Go to the **Equipment** page to:

* Add equipment
* Edit equipment
* Delete equipment
* Search equipment

### 5. Manage Transactions

Go to the **Transactions** page to:

* Borrow equipment
* View borrowing records
* Search transactions
* Filter transactions
* Return equipment
* Monitor overdue transactions

---

## Hosting

The frontend of the system is hosted using **GitHub Pages**.

The backend database and authentication are provided by **Supabase**.

```text
Frontend
HTML + CSS + JavaScript
        ↓
GitHub Pages
        ↓
Supabase
        ↓
PostgreSQL Database
```

---

## Security

Supabase Row Level Security (RLS) is enabled for the system tables.

Only authenticated users are allowed to access and manage equipment and borrowing records.

The frontend uses the Supabase **Publishable Key**. The Supabase secret key must never be placed in the frontend source code.

---

## Use Cases

The major system use cases are:

* Login
* View Dashboard
* Add Equipment
* View Equipment
* Edit Equipment
* Delete Equipment
* Search Equipment
* Record Borrowing
* View Transactions
* Return Equipment
* Search Transactions
* Filter Transactions
* Logout

---

## Expected Output

The completed system should allow an authenticated user to:

1. Log in securely.
2. View the dashboard.
3. Add and manage equipment.
4. Record borrowing transactions.
5. Return borrowed equipment.
6. Automatically detect overdue transactions.
7. Search and filter records.
8. Monitor equipment availability.

---

## Author

**Name:** [Your Name]
**Section:** BSIT Section B
**Course:** Systems Analysis and Design

---

## Project Status

**Status:** Completed / For Testing and Demonstration
