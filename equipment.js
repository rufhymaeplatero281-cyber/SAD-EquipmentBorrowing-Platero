// ==========================================
// EQUIPMENT MANAGEMENT
// ==========================================


// ==========================================
// CHECK LOGIN
// ==========================================

async function checkUser() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();


    if (error || !user) {

        window.location.href = "login.html";

        return false;
    }

    return true;
}


// ==========================================
// VARIABLES
// ==========================================

const form = document.getElementById("equipmentForm");

const formContainer = document.getElementById("formContainer");

const formTitle = document.getElementById("formTitle");

const equipmentId = document.getElementById("equipmentId");

const equipmentName = document.getElementById("equipmentName");

const category = document.getElementById("category");

const assetCode = document.getElementById("assetCode");

const condition = document.getElementById("condition");

const tableBody = document.getElementById("equipmentTableBody");

const searchInput = document.getElementById("searchInput");

const message = document.getElementById("message");

const showFormBtn = document.getElementById("showFormBtn");

const cancelBtn = document.getElementById("cancelBtn");


// Store equipment records

let equipmentList = [];


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(text, type = "success") {

    message.textContent = text;

    if (type === "success") {

        message.style.color = "green";

    } else {

        message.style.color = "red";

    }

    setTimeout(function() {

        message.textContent = "";

    }, 3000);
}


// ==========================================
// SHOW ADD FORM
// ==========================================

showFormBtn.addEventListener("click", function() {

    form.reset();

    equipmentId.value = "";

    formTitle.textContent = "Add Equipment";

    formContainer.classList.remove("hidden");

});


// ==========================================
// CANCEL FORM
// ==========================================

cancelBtn.addEventListener("click", function() {

    form.reset();

    equipmentId.value = "";

    formContainer.classList.add("hidden");

});


// ==========================================
// LOAD EQUIPMENT
// ==========================================

async function loadEquipment() {

    const {
        data,
        error
    } = await supabaseClient
        .from("equipment")
        .select("*")
        .order("id", { ascending: true });


    if (error) {

        console.error(error);

        showMessage(
            "Failed to load equipment: " + error.message,
            "error"
        );

        return;
    }


    equipmentList = data || [];

    displayEquipment(equipmentList);
}


// ==========================================
// DISPLAY EQUIPMENT
// ==========================================

function displayEquipment(list) {

    tableBody.innerHTML = "";


    if (list.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No equipment found.
                </td>
            </tr>
        `;

        return;
    }


    list.forEach(function(item) {

        const row = document.createElement("tr");


        const availabilityClass =
            item.availability === "Available"
                ? "available"
                : "borrowed";


        row.innerHTML = `

            <td>${item.id}</td>

            <td>${item.equipment_name}</td>

            <td>${item.category}</td>

            <td>${item.asset_code}</td>

            <td>${item.condition}</td>

            <td class="${availabilityClass}">
                ${item.availability}
            </td>

            <td>

                <button
                    class="edit-btn"
                    onclick="editEquipment(${item.id})"
                >
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteEquipment(${item.id})"
                >
                    Delete
                </button>

            </td>
        `;


        tableBody.appendChild(row);

    });

}


// ==========================================
// ADD / EDIT EQUIPMENT
// ==========================================

form.addEventListener("submit", async function(event) {

    event.preventDefault();


    const nameValue =
        equipmentName.value.trim();

    const categoryValue =
        category.value.trim();

    const assetValue =
        assetCode.value.trim();

    const conditionValue =
        condition.value;


    // ======================================
    // VALIDATION
    // ======================================

    if (!nameValue) {

        showMessage(
            "Equipment name is required.",
            "error"
        );

        return;
    }


    if (!categoryValue) {

        showMessage(
            "Category is required.",
            "error"
        );

        return;
    }


    if (!assetValue) {

        showMessage(
            "Asset code is required.",
            "error"
        );

        return;
    }


    const idValue = equipmentId.value;


    // ======================================
    // EDIT
    // ======================================

    if (idValue) {

        const {
            error
        } = await supabaseClient
            .from("equipment")
            .update({

                equipment_name: nameValue,

                category: categoryValue,

                asset_code: assetValue,

                condition: conditionValue

            })
            .eq("id", idValue);


        if (error) {

            console.error(error);

            showMessage(
                "Update failed: " + error.message,
                "error"
            );

            return;
        }


        showMessage(
            "Equipment updated successfully!"
        );

    }


    // ======================================
    // ADD
    // ======================================

    else {

        const {
            error
        } = await supabaseClient
            .from("equipment")
            .insert([{

                equipment_name: nameValue,

                category: categoryValue,

                asset_code: assetValue,

                condition: conditionValue,

                availability: "Available"

            }]);


        if (error) {

            console.error(error);

            if (
                error.message
                    .toLowerCase()
                    .includes("duplicate")
            ) {

                showMessage(
                    "Asset code already exists.",
                    "error"
                );

            } else {

                showMessage(
                    "Add failed: " + error.message,
                    "error"
                );

            }

            return;
        }


        showMessage(
            "Equipment added successfully!"
        );

    }


    // ======================================
    // RESET
    // ======================================

    form.reset();

    equipmentId.value = "";

    formContainer.classList.add("hidden");

    formTitle.textContent = "Add Equipment";


    // Reload table

    loadEquipment();

});


// ==========================================
// EDIT EQUIPMENT
// ==========================================

window.editEquipment = function(id) {

    const item =
        equipmentList.find(
            equipment => equipment.id === id
        );


    if (!item) {

        showMessage(
            "Equipment not found.",
            "error"
        );

        return;
    }


    equipmentId.value = item.id;

    equipmentName.value =
        item.equipment_name;

    category.value =
        item.category;

    assetCode.value =
        item.asset_code;

    condition.value =
        item.condition;


    formTitle.textContent =
        "Edit Equipment";


    formContainer.classList.remove("hidden");


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

};


// ==========================================
// DELETE EQUIPMENT
// ==========================================

window.deleteEquipment = async function(id) {

    const item =
        equipmentList.find(
            equipment => equipment.id === id
        );


    if (!item) {

        return;
    }


    // Confirmation required
    // Business Rule BR-10

    const confirmed = confirm(
        "Are you sure you want to delete " +
        item.equipment_name +
        "?"
    );


    if (!confirmed) {

        return;
    }


    // Prevent deletion if borrowed

    if (item.availability === "Borrowed") {

        showMessage(
            "Borrowed equipment cannot be deleted.",
            "error"
        );

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("equipment")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(error);

        showMessage(
            "Delete failed: " + error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Equipment deleted successfully!"
    );


    loadEquipment();

};


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener(
    "input",
    function() {

        const searchTerm =
            searchInput.value
                .toLowerCase()
                .trim();


        const filtered =
            equipmentList.filter(function(item) {

                return (

                    item.equipment_name
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    item.category
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    item.asset_code
                        .toLowerCase()
                        .includes(searchTerm)

                );

            });


        displayEquipment(filtered);

    }
);


// ==========================================
// START
// ==========================================

async function startEquipmentPage() {

    const loggedIn =
        await checkUser();


    if (!loggedIn) {

        return;
    }


    await loadEquipment();

}


startEquipmentPage();