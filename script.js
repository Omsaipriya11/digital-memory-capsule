const STORAGE_KEY = "digitalMemoryCapsules";

let capsules = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];


// DOM elements
const capsuleForm = document.getElementById("capsuleForm");

const titleInput = document.getElementById("capsuleTitle");
const typeInput = document.getElementById("memoryType");
const dateInput = document.getElementById("unlockDate");
const memoryInput = document.getElementById("memoryText");

const characterCount = document.getElementById("characterCount");

const capsuleContainer = document.getElementById("capsuleContainer");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");


// Modal
const memoryModal = document.getElementById("memoryModal");
const modalTitle = document.getElementById("modalTitle");
const modalType = document.getElementById("modalType");
const modalDate = document.getElementById("modalDate");
const modalMemory = document.getElementById("modalMemory");


// --------------------------------------------------
// INITIALIZATION
// --------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    setMinimumDate();

    updateCharacterCount();

    renderCapsules();

    updateStats();

    startCountdownUpdater();

});


// --------------------------------------------------
// DATE SETUP
// --------------------------------------------------

function setMinimumDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    const todayString = `${year}-${month}-${day}`;

    dateInput.min = todayString;

}


// --------------------------------------------------
// CHARACTER COUNT
// --------------------------------------------------

memoryInput.addEventListener("input", updateCharacterCount);

function updateCharacterCount() {

    characterCount.textContent = memoryInput.value.length;

}


// --------------------------------------------------
// CREATE CAPSULE
// --------------------------------------------------

capsuleForm.addEventListener("submit", function (event) {

    event.preventDefault();


    const title = titleInput.value.trim();

    const type = typeInput.value;

    const unlockDate = dateInput.value;

    const memory = memoryInput.value.trim();


    if (!title || !unlockDate || !memory) {

        alert("Please fill in all the required fields.");

        return;

    }


    const selectedDate = new Date(`${unlockDate}T23:59:59`);

    const now = new Date();


    if (selectedDate <= now) {

        alert("Please choose a future unlock date.");

        return;

    }


    const newCapsule = {

        id: Date.now(),

        title: title,

        type: type,

        unlockDate: unlockDate,

        memory: memory,

        createdAt: new Date().toISOString()

    };


    capsules.unshift(newCapsule);

    saveCapsules();


    capsuleForm.reset();

    updateCharacterCount();

    setMinimumDate();

    renderCapsules();

    updateStats();


    alert("🔐 Your memory capsule has been sealed!");

});


// --------------------------------------------------
// SAVE
// --------------------------------------------------

function saveCapsules() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(capsules)
    );

}


// --------------------------------------------------
// CHECK IF UNLOCKED
// --------------------------------------------------

function isUnlocked(capsule) {

    const unlockTime =
        new Date(`${capsule.unlockDate}T23:59:59`).getTime();

    return Date.now() >= unlockTime;

}


// --------------------------------------------------
// FORMAT DATE
// --------------------------------------------------

function formatDate(dateString) {

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

}


// --------------------------------------------------
// CALCULATE COUNTDOWN
// --------------------------------------------------

function getCountdown(dateString) {

    const target =
        new Date(`${dateString}T23:59:59`).getTime();

    const now = Date.now();

    const difference = target - now;


    if (difference <= 0) {

        return {
            unlocked: true,
            text: "Ready to open"
        };

    }


    const totalSeconds =
        Math.floor(difference / 1000);


    const days =
        Math.floor(totalSeconds / 86400);


    const hours =
        Math.floor(
            (totalSeconds % 86400) / 3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const seconds =
        totalSeconds % 60;


    return {

        unlocked: false,

        text:
            `${days}d ${String(hours).padStart(2, "0")}h ` +
            `${String(minutes).padStart(2, "0")}m ` +
            `${String(seconds).padStart(2, "0")}s`

    };

}


// --------------------------------------------------
// RENDER CAPSULES
// --------------------------------------------------

function renderCapsules() {

    const searchTerm =
        searchInput.value.trim().toLowerCase();

    const filter =
        filterSelect.value;


    let filteredCapsules = capsules.filter(capsule => {

        const matchesSearch =
            capsule.title.toLowerCase().includes(searchTerm) ||
            capsule.type.toLowerCase().includes(searchTerm) ||
            capsule.memory.toLowerCase().includes(searchTerm);


        const unlocked = isUnlocked(capsule);


        const matchesFilter =
            filter === "all" ||
            (filter === "locked" && !unlocked) ||
            (filter === "unlocked" && unlocked);


        return matchesSearch && matchesFilter;

    });


    capsuleContainer.innerHTML = "";


    if (filteredCapsules.length === 0) {

        capsuleContainer.style.display = "none";

        emptyState.style.display = "block";

        if (capsules.length > 0) {

            emptyState.querySelector("h3").textContent =
                "No matching capsules";

            emptyState.querySelector("p").textContent =
                "Try another search or change the filter.";

            emptyState.querySelector("button").style.display =
                "none";

        } else {

            emptyState.querySelector("h3").textContent =
                "No memories yet";

            emptyState.querySelector("p").textContent =
                "Your future self is waiting. Create your first memory capsule above.";

            emptyState.querySelector("button").style.display =
                "inline-block";

        }

        return;

    }


    capsuleContainer.style.display = "grid";

    emptyState.style.display = "none";


    filteredCapsules.forEach(capsule => {

        capsuleContainer.appendChild(
            createCapsuleCard(capsule)
        );

    });

}


// --------------------------------------------------
// CREATE CARD
// --------------------------------------------------

function createCapsuleCard(capsule) {

    const unlocked = isUnlocked(capsule);

    const countdown = getCountdown(capsule.unlockDate);


    const card = document.createElement("div");

    card.className =
        `capsule-card ${unlocked ? "unlocked" : "locked"}`;


    const statusText =
        unlocked ? "🔓 OPENED" : "🔒 SEALED";


    const countdownLabel =
        unlocked ? "CAPSULE STATUS" : "TIME UNTIL OPEN";


    const button =
        unlocked
            ? `
                <button
                    class="open-btn"
                    onclick="openMemory(${capsule.id})"
                >
                    🔓 Open Memory
                </button>
              `
            : "";


    card.innerHTML = `

        <div class="card-top">

            <span class="status ${unlocked ? "unlocked" : "locked"}">
                ${statusText}
            </span>

            <button
                class="delete-btn"
                onclick="deleteCapsule(${capsule.id})"
                title="Delete capsule"
            >
                ×
            </button>

        </div>


        <h4>${escapeHTML(capsule.title)}</h4>


        <div class="card-type">
            ${escapeHTML(capsule.type)}
        </div>


        <div class="card-date">
            📅
            Unlocks ${formatDate(capsule.unlockDate)}
        </div>


        <div class="countdown">

            <span class="countdown-label">
                ${countdownLabel}
            </span>

            <div
                class="countdown-time"
                data-date="${capsule.unlockDate}"
            >
                ${countdown.text}
            </div>

        </div>


        ${button}

    `;


    return card;

}


// --------------------------------------------------
// DELETE CAPSULE
// --------------------------------------------------

function deleteCapsule(id) {

    const capsule =
        capsules.find(item => item.id === id);


    if (!capsule) return;


    const confirmed =
        confirm(
            `Delete "${capsule.title}" permanently?`
        );


    if (!confirmed) return;


    capsules =
        capsules.filter(item => item.id !== id);


    saveCapsules();

    renderCapsules();

    updateStats();

}


// --------------------------------------------------
// OPEN MEMORY
// --------------------------------------------------

function openMemory(id) {

    const capsule =
        capsules.find(item => item.id === id);


    if (!capsule) return;


    if (!isUnlocked(capsule)) {

        alert("🔒 This memory is still sealed.");

        return;

    }


    modalTitle.textContent =
        capsule.title;

    modalType.textContent =
        capsule.type;

    modalDate.textContent =
        `Unlocked ${formatDate(capsule.unlockDate)}`;

    modalMemory.textContent =
        capsule.memory;


    memoryModal.classList.add("active");

}


// --------------------------------------------------
// CLOSE MODAL
// --------------------------------------------------

function closeModal() {

    memoryModal.classList.remove("active");

}


memoryModal.addEventListener("click", function (event) {

    if (event.target === memoryModal) {

        closeModal();

    }

});


document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeModal();

    }

});


// --------------------------------------------------
// SEARCH & FILTER
// --------------------------------------------------

searchInput.addEventListener(
    "input",
    renderCapsules
);


filterSelect.addEventListener(
    "change",
    renderCapsules
);


// --------------------------------------------------
// UPDATE STATS
// --------------------------------------------------

function updateStats() {

    const total =
        capsules.length;


    const unlocked =
        capsules.filter(
            capsule => isUnlocked(capsule)
        ).length;


    const locked =
        total - unlocked;


    document.getElementById("totalCapsules")
        .textContent = total;


    document.getElementById("lockedCapsules")
        .textContent = locked;


    document.getElementById("unlockedCapsules")
        .textContent = unlocked;


    document.getElementById("memoryCount")
        .textContent = total;

}


// --------------------------------------------------
// LIVE COUNTDOWN
// --------------------------------------------------

function startCountdownUpdater() {

    setInterval(() => {

        const countdownElements =
            document.querySelectorAll(
                ".countdown-time"
            );


        countdownElements.forEach(element => {

            const date =
                element.dataset.date;


            const countdown =
                getCountdown(date);


            element.textContent =
                countdown.text;

        });


        updateStats();

        renderStatusChanges();

    }, 1000);

}


// --------------------------------------------------
// RENDER ONLY WHEN STATUS CHANGES
// --------------------------------------------------

function renderStatusChanges() {

    const cards =
        document.querySelectorAll(
            ".capsule-card"
        );


    cards.forEach(card => {

        const dateElement =
            card.querySelector(
                ".countdown-time"
            );


        if (!dateElement) return;


        const unlocked =
            isUnlocked(
                dateElement.dataset.date
            );


        const currentlyUnlocked =
            card.classList.contains(
                "unlocked"
            );


        if (unlocked !== currentlyUnlocked) {

            renderCapsules();

        }

    });

}


// --------------------------------------------------
// LOAD SAMPLE
// --------------------------------------------------

function loadSample() {

    const futureDate =
        new Date();


    futureDate.setDate(
        futureDate.getDate() + 30
    );


    const year =
        futureDate.getFullYear();


    const month =
        String(
            futureDate.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            futureDate.getDate()
        ).padStart(2, "0");


    titleInput.value =
        "A Message to My Future Self";


    typeInput.value =
        "Future Me";


    dateInput.value =
        `${year}-${month}-${day}`;


    memoryInput.value =
`Hey future me!

I hope you're reading this after making progress toward your goals.

Remember how excited you were to learn new technologies, build projects, improve your skills and create a better future?

Whatever happened during these 30 days, be proud of yourself for continuing.

Keep learning. Keep building. Keep going.

See you on the other side!`;


    updateCharacterCount();

}


// --------------------------------------------------
// SCROLL TO CREATE
// --------------------------------------------------

function scrollToCreate() {

    document
        .getElementById("createSection")
        .scrollIntoView({
            behavior: "smooth"
        });

}


// --------------------------------------------------
// ESCAPE HTML
// --------------------------------------------------

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;

}