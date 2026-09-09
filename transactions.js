// ============================================
// TRANSACTIONS.JS
// Borrow / Return / Overdue
// ============================================


// --------------------------------------------
// GLOBAL VARIABLES
// --------------------------------------------

let allTransactions = [];


// --------------------------------------------
// CHECK LOGIN
// --------------------------------------------

async function checkUser() {

    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "login.html";
        return null;
    }

    return data.user;
}


// --------------------------------------------
// SHOW MESSAGE
// --------------------------------------------

function showMessage(message, type) {

    const messageBox = document.getElementById("message");

    messageBox.textContent = message;

    messageBox.className = "message " + type;

    messageBox.style.display = "block";

    setTimeout(() => {
        messageBox.style.display = "none";
    }, 4000);
}


// --------------------------------------------
// GET TODAY'S DATE
// --------------------------------------------

function getToday() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// --------------------------------------------
// SET DEFAULT BORROW DATE
// --------------------------------------------

function setDefaultDate() {

    const dateBorrowed = document.getElementById("dateBorrowed");

    if (dateBorrowed) {
        dateBorrowed.value = getToday();
    }
}


// --------------------------------------------
// LOAD AVAILABLE EQUIPMENT
// --------------------------------------------

async function loadAvailableEquipment() {

    const equipmentSelect = document.getElementById("equipmentId");

    equipmentSelect.innerHTML =
        `<option value="">-- Select Available Equipment --</option>`;

    const { data, error } = await supabaseClient
        .from("equipment")
        .select("*")
        .eq("availability", "Available")
        .order("equipment_name", { ascending: true });

    if (error) {

        console.error(error);

        showMessage(
            "Failed to load available equipment: " + error.message,
            "error"
        );

        return;
    }

    if (!data || data.length === 0) {

        equipmentSelect.innerHTML =
            `<option value="">No available equipment</option>`;

        return;
    }

    data.forEach(equipment => {

        const option = document.createElement("option");

        option.value = equipment.id;

        option.textContent =
            `${equipment.equipment_name} (${equipment.asset_code})`;

        equipmentSelect.appendChild(option);
    });
}


// --------------------------------------------
// BORROW EQUIPMENT
// --------------------------------------------

async function borrowEquipment(event) {

    event.preventDefault();

    const user = await checkUser();

    if (!user) {
        return;
    }


    // Get form values

    const equipmentId =
        document.getElementById("equipmentId").value;

    const borrowerName =
        document.getElementById("borrowerName").value.trim();

    const borrowerType =
        document.getElementById("borrowerType").value;

    const department =
        document.getElementById("department").value.trim();

    const dateBorrowed =
        document.getElementById("dateBorrowed").value;

    const dueDate =
        document.getElementById("dueDate").value;


    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (!equipmentId) {

        showMessage(
            "Please select equipment.",
            "error"
        );

        return;
    }


    if (!borrowerName) {

        showMessage(
            "Borrower name is required.",
            "error"
        );

        return;
    }


    if (!borrowerType) {

        showMessage(
            "Please select borrower type.",
            "error"
        );

        return;
    }


    if (!department) {

        showMessage(
            "Department is required.",
            "error"
        );

        return;
    }


    if (!dateBorrowed) {

        showMessage(
            "Please select borrowing date.",
            "error"
        );

        return;
    }


    if (!dueDate) {

        showMessage(
            "Please select due date.",
            "error"
        );

        return;
    }


    // BR-05
    // Due date cannot be earlier than borrowing date

    if (dueDate < dateBorrowed) {

        showMessage(
            "Due date cannot be earlier than borrowing date.",
            "error"
        );

        return;
    }


    // ----------------------------------------
    // CHECK IF EQUIPMENT IS STILL AVAILABLE
    // ----------------------------------------

    const { data: equipment, error: equipmentError } =
        await supabaseClient
            .from("equipment")
            .select("id, equipment_name, availability")
            .eq("id", equipmentId)
            .single();


    if (equipmentError) {

        showMessage(
            "Failed to check equipment: " +
            equipmentError.message,
            "error"
        );

        return;
    }


    if (!equipment) {

        showMessage(
            "Equipment not found.",
            "error"
        );

        return;
    }


    // BR-03
    // Only available equipment can be borrowed

    if (equipment.availability !== "Available") {

        showMessage(
            "This equipment is no longer available.",
            "error"
        );

        await loadAvailableEquipment();

        return;
    }


    // ----------------------------------------
    // INSERT BORROW TRANSACTION
    // ----------------------------------------

    const { data: transaction, error: transactionError } =
        await supabaseClient
            .from("borrow_transactions")
            .insert([
                {
                    equipment_id: equipmentId,
                    borrower_name: borrowerName,
                    borrower_type: borrowerType,
                    department: department,
                    date_borrowed: dateBorrowed,
                    due_date: dueDate,
                    date_returned: null,
                    status: "Borrowed",
                    user_id: user.id
                }
            ])
            .select()
            .single();


    if (transactionError) {

        console.error(transactionError);

        showMessage(
            "Failed to record borrowing: " +
            transactionError.message,
            "error"
        );

        return;
    }


    // ----------------------------------------
    // UPDATE EQUIPMENT AVAILABILITY
    // ----------------------------------------

    const { error: updateError } =
        await supabaseClient
            .from("equipment")
            .update({
                availability: "Borrowed"
            })
            .eq("id", equipmentId);


    if (updateError) {

        console.error(updateError);

        showMessage(
            "Borrowing was recorded, but equipment availability failed to update: " +
            updateError.message,
            "error"
        );

        await loadTransactions();

        return;
    }


    // ----------------------------------------
    // SUCCESS
    // ----------------------------------------

    showMessage(
        "Equipment borrowed successfully!",
        "success"
    );


    document.getElementById("borrowForm").reset();

    setDefaultDate();

    await loadAvailableEquipment();

    await loadTransactions();
}


// --------------------------------------------
// LOAD TRANSACTIONS
// --------------------------------------------

async function loadTransactions() {

    const { data, error } = await supabaseClient
        .from("borrow_transactions")
        .select(`
            *,
            equipment (
                equipment_name,
                asset_code
            )
        `)
        .order("id", { ascending: false });


    if (error) {

        console.error(error);

        showMessage(
            "Failed to load transactions: " +
            error.message,
            "error"
        );

        return;
    }


    allTransactions = data || [];


    // Check overdue transactions

    await updateOverdueTransactions();


    // Reload after updating overdue status

    const { data: updatedData, error: reloadError } =
        await supabaseClient
            .from("borrow_transactions")
            .select(`
                *,
                equipment (
                    equipment_name,
                    asset_code
                )
            `)
            .order("id", { ascending: false });


    if (reloadError) {

        console.error(reloadError);

        return;
    }


    allTransactions = updatedData || [];

    displayTransactions(allTransactions);
}


// --------------------------------------------
// UPDATE OVERDUE TRANSACTIONS
// --------------------------------------------

async function updateOverdueTransactions() {

    const today = getToday();


    const overdueTransactions = allTransactions.filter(transaction => {

        return (
            transaction.status === "Borrowed" &&
            transaction.due_date < today &&
            transaction.date_returned === null
        );

    });


    if (overdueTransactions.length === 0) {
        return;
    }


    // Update each overdue transaction

    for (const transaction of overdueTransactions) {

        const { error } = await supabaseClient
            .from("borrow_transactions")
            .update({
                status: "Overdue"
            })
            .eq("id", transaction.id);


        if (error) {

            console.error(
                "Failed to update overdue transaction:",
                error
            );
        }
    }
}


// --------------------------------------------
// DISPLAY TRANSACTIONS
// --------------------------------------------

function displayTransactions(list) {

    const tableBody =
        document.getElementById("transactionTableBody");


    tableBody.innerHTML = "";


    if (!list || list.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center;">
                    No transactions found.
                </td>
            </tr>
        `;

        return;
    }


    list.forEach(transaction => {

        const row = document.createElement("tr");


        // Equipment information

        const equipmentName =
            transaction.equipment
                ? transaction.equipment.equipment_name
                : "Unknown Equipment";


        // Status class

        let statusClass = "status-borrowed";

        if (transaction.status === "Returned") {
            statusClass = "status-returned";
        }

        if (transaction.status === "Overdue") {
            statusClass = "status-overdue";
        }


        // Return button

        let actionButton = "";


        if (
            transaction.status === "Borrowed" ||
            transaction.status === "Overdue"
        ) {

            actionButton = `
                <button
                    class="btn-success"
                    onclick="returnEquipment(${transaction.id})"
                >
                    Return
                </button>
            `;

        } else {

            actionButton = `
                <span>Completed</span>
            `;
        }


        row.innerHTML = `
            <td>${transaction.id}</td>

            <td>${equipmentName}</td>

            <td>${transaction.borrower_name}</td>

            <td>${transaction.borrower_type}</td>

            <td>${transaction.department}</td>

            <td>${transaction.date_borrowed}</td>

            <td>${transaction.due_date}</td>

            <td>
                ${transaction.date_returned || "-"}
            </td>

            <td>
                <span class="status ${statusClass}">
                    ${transaction.status}
                </span>
            </td>

            <td>
                ${actionButton}
            </td>
        `;


        tableBody.appendChild(row);
    });
}


// --------------------------------------------
// RETURN EQUIPMENT
// --------------------------------------------

async function returnEquipment(transactionId) {

    const user = await checkUser();

    if (!user) {
        return;
    }


    const confirmReturn = confirm(
        "Are you sure you want to return this equipment?"
    );


    if (!confirmReturn) {
        return;
    }


    // ----------------------------------------
    // GET TRANSACTION
    // ----------------------------------------

    const { data: transaction, error: transactionError } =
        await supabaseClient
            .from("borrow_transactions")
            .select("*")
            .eq("id", transactionId)
            .single();


    if (transactionError) {

        showMessage(
            "Failed to find transaction: " +
            transactionError.message,
            "error"
        );

        return;
    }


    if (!transaction) {

        showMessage(
            "Transaction not found.",
            "error"
        );

        return;
    }


    // BR-12
    // Returned transaction cannot be returned twice

    if (transaction.status === "Returned") {

        showMessage(
            "This transaction has already been returned.",
            "error"
        );

        return;
    }


    // ----------------------------------------
    // UPDATE TRANSACTION
    // ----------------------------------------

    const returnDate = getToday();


    const { error: updateTransactionError } =
        await supabaseClient
            .from("borrow_transactions")
            .update({
                date_returned: returnDate,
                status: "Returned"
            })
            .eq("id", transactionId);


    if (updateTransactionError) {

        console.error(updateTransactionError);

        showMessage(
            "Failed to return equipment: " +
            updateTransactionError.message,
            "error"
        );

        return;
    }


    // ----------------------------------------
    // UPDATE EQUIPMENT
    // ----------------------------------------

    const { error: updateEquipmentError } =
        await supabaseClient
            .from("equipment")
            .update({
                availability: "Available"
            })
            .eq("id", transaction.equipment_id);


    if (updateEquipmentError) {

        console.error(updateEquipmentError);

        showMessage(
            "Transaction returned, but equipment availability failed to update: " +
            updateEquipmentError.message,
            "error"
        );

        await loadTransactions();

        return;
    }


    // ----------------------------------------
    // SUCCESS
    // ----------------------------------------

    showMessage(
        "Equipment returned successfully!",
        "success"
    );


    await loadAvailableEquipment();

    await loadTransactions();
}


// --------------------------------------------
// SEARCH TRANSACTIONS
// --------------------------------------------

function searchTransactions() {

    const searchValue =
        document.getElementById("searchInput")
            .value
            .toLowerCase()
            .trim();


    if (!searchValue) {

        displayTransactions(allTransactions);

        return;
    }


    const filtered = allTransactions.filter(transaction => {

        const equipmentName =
            transaction.equipment
                ? transaction.equipment.equipment_name
                : "";


        const assetCode =
            transaction.equipment
                ? transaction.equipment.asset_code
                : "";


        return (
            equipmentName.toLowerCase().includes(searchValue) ||
            assetCode.toLowerCase().includes(searchValue) ||
            transaction.borrower_name
                .toLowerCase()
                .includes(searchValue) ||
            transaction.borrower_type
                .toLowerCase()
                .includes(searchValue) ||
            transaction.department
                .toLowerCase()
                .includes(searchValue) ||
            transaction.status
                .toLowerCase()
                .includes(searchValue)
        );

    });


    displayTransactions(filtered);
}


// --------------------------------------------
// CLEAR FORM
// --------------------------------------------

function clearForm() {

    document.getElementById("borrowForm").reset();

    setDefaultDate();
}


// --------------------------------------------
// LOGOUT
// --------------------------------------------

async function logout() {

    const { error } =
        await supabaseClient.auth.signOut();


    if (error) {

        showMessage(
            "Logout failed: " + error.message,
            "error"
        );

        return;
    }


    window.location.href = "login.html";
}


// --------------------------------------------
// START TRANSACTION PAGE
// --------------------------------------------

async function startTransactionPage() {

    const user = await checkUser();

    if (!user) {
        return;
    }


    // Set today's date

    setDefaultDate();


    // Load available equipment

    await loadAvailableEquipment();


    // Load transactions

    await loadTransactions();
}


// --------------------------------------------
// EVENT LISTENERS
// --------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("borrowForm")
        .addEventListener("submit", borrowEquipment);


    document
        .getElementById("searchInput")
        .addEventListener("input", searchTransactions);


    document
        .getElementById("clearBtn")
        .addEventListener("click", clearForm);


    document
        .getElementById("logoutBtn")
        .addEventListener("click", logout);


    startTransactionPage();
});