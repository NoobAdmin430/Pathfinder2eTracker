function createRow() {
    const template = document.getElementById('row-template');
    const clone = template.content.cloneNode(true);

    const conditionSelect = clone.querySelector(".conditions");
    conditionSelect.innerHTML = "";
    const list = window.conditionList || [
        "", "Dead", "Unconscious", "Flat-footed", "Dying", "Bleeding", "Stunned", "Frightened",
        "Paralyzed", "Confused", "Blinded", "Invisible", "Grappled", "Restrained", "Poisoned",
        "Exhausted", "Slowed", "Quickened", "Fascinated", "Enfeebled", "Clumsy", "Sickened",
        "Prone", "Persistent Damage", "Grabbed", "Immobilized", "Hidden"
    ];
    list.forEach(cond => {
        const opt = document.createElement("option");
        opt.value = cond;
        opt.textContent = cond;
        conditionSelect.appendChild(opt);
    });

    return clone;
}

function populateRows(count = 30) {
    const body = document.getElementById('tracker-body');
    body.innerHTML = '';
    for (let i = 0; i < count; i++) {
        body.appendChild(createRow());
    }
    applyHighlights();
}

function nextRound() {
    const roundElem = document.getElementById('round');
    const current = parseInt(roundElem.textContent || "1");
    roundElem.textContent = current + 1;

    document.querySelectorAll('.turn').forEach(cb => cb.checked = false);
    saveTrackerToLocalStorage();
    applyHighlights();
}

function resetTracker() {
    const confirmReset = confirm(
        "Are you sure you wish to reset the tracker?\nThis will wipe all information from the tracker."
    );

    if (!confirmReset) {
        return; // Exit if the user cancels
    }

    document.getElementById('round').textContent = 1;

    document.querySelectorAll('#tracker-body input, #tracker-body select').forEach(el => {
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
    });

    clearLocalStorage();
    applyHighlights();
}


function newEncounter() {
    document.getElementById('round').textContent = 1;
    const rows = document.querySelectorAll('#tracker tbody tr');
    rows.forEach(row => {
        row.querySelector('.init').value = '';
        row.querySelector('.hp').value = '';
        row.querySelector('.conditions').value = '';
        row.querySelector('.notes').value = '';
        row.querySelector('.turn').checked = false;
    });
    saveTrackerToLocalStorage();
    applyHighlights();
}

function sortByInitAndDex() {
    const tbody = document.getElementById("tracker-body");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort((a, b) => {
        const initA = parseInt(a.querySelector(".init").value || 0);
        const initB = parseInt(b.querySelector(".init").value || 0);
        const dexA = parseInt(a.querySelector(".dexmod").value.replace(/[^0-9-]/g, "") || 0);
        const dexB = parseInt(b.querySelector(".dexmod").value.replace(/[^0-9-]/g, "") || 0);

        if (initA !== initB) return initB - initA;
        return dexB - dexA;
    });

    rows.forEach(row => tbody.appendChild(row));
    saveTrackerToLocalStorage();
    applyHighlights();
}

function applyHighlights() {
    const rows = document.querySelectorAll('#tracker tbody tr');
    let lastChecked = -1;
    let firstUnchecked = -1;

    rows.forEach((row, index) => {
        row.classList.remove('highlight-dead', 'highlight-last-checked', 'highlight-first-unchecked', 'highlight-checked');
        const condition = row.querySelector('.conditions').value;
        const turnChecked = row.querySelector('.turn').checked;

        if (condition === 'Dead') {
            row.classList.add('highlight-dead');
        } else if (turnChecked) {
            row.classList.add('highlight-checked');
            lastChecked = index;
        } else if (firstUnchecked === -1) {
            firstUnchecked = index;
        }
    });

    if (lastChecked >= 0) rows[lastChecked].classList.add('highlight-last-checked');
    if (firstUnchecked >= 0) rows[firstUnchecked].classList.add('highlight-first-unchecked');
}

function saveTrackerToLocalStorage() {
    const rows = document.querySelectorAll('#tracker tbody tr');
    const data = [];

    rows.forEach(row => {
        data.push({
            name: row.querySelector('.name').value,
            type: row.querySelector('.type').value,
            init: row.querySelector('.init').value,
            dexmod: row.querySelector('.dexmod').value,
            hp: row.querySelector('.hp').value,
            conditions: row.querySelector('.conditions').value,
            notes: row.querySelector('.notes').value,
            turn: row.querySelector('.turn').checked
        });
    });

    localStorage.setItem("pf2eTrackerData", JSON.stringify(data));
    localStorage.setItem("pf2eTrackerRound", document.getElementById('round').textContent);
}

function loadTrackerFromLocalStorage() {
    const savedData = JSON.parse(localStorage.getItem("pf2eTrackerData"));
    const round = localStorage.getItem("pf2eTrackerRound") || 1;

    if (savedData && Array.isArray(savedData)) {
        const body = document.getElementById('tracker-body');
        body.innerHTML = '';
        savedData.forEach(entry => {
            const row = createRow();
            row.querySelector('.name').value = entry.name;
            row.querySelector('.type').value = entry.type;
            row.querySelector('.init').value = entry.init;
            row.querySelector('.dexmod').value = entry.dexmod;
            row.querySelector('.hp').value = entry.hp;
            row.querySelector('.conditions').value = entry.conditions;
            row.querySelector('.notes').value = entry.notes;
            row.querySelector('.turn').checked = entry.turn;
            body.appendChild(row);
        });
        document.getElementById('round').textContent = round;
    } else {
        populateRows(30);
    }
    applyHighlights();
}

function clearLocalStorage() {
    localStorage.removeItem("pf2eTrackerData");
    localStorage.removeItem("pf2eTrackerRound");
}

async function loadConditions() {
    try {
        const response = await fetch("conditions.csv");
        const text = await response.text();
        window.conditionList = text.split(/\r?\n/).filter(Boolean);
    } catch (e) {
        window.conditionList = [
            "", "Dead", "Unconscious", "Flat-footed", "Dying", "Bleeding", "Stunned", "Frightened",
            "Paralyzed", "Confused", "Blinded", "Invisible", "Grappled", "Restrained", "Poisoned",
            "Exhausted", "Slowed", "Quickened", "Fascinated", "Enfeebled", "Clumsy", "Sickened",
            "Prone", "Persistent Damage", "Grabbed", "Immobilized", "Hidden"
        ];
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadConditions();
    loadTrackerFromLocalStorage();

    // Apply changes immediately when editing any input or select
    document.getElementById('tracker').addEventListener('input', () => {
        saveTrackerToLocalStorage();
        applyHighlights();
    });
});
