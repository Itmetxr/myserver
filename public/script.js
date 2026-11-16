// ==========================================
// API CONFIGURATION & STATE
// ==========================================

// ใช้ "" (Relative Path) เพื่อดึง API จาก Domain/Port เดียวกันกับที่ Express รันอยู่
const API_URL = ""; 
let DRONE_ID = null;

const LIMIT = 12;
let currentPage = 1;


// ==========================================
// INITIALIZE SETUP
// ==========================================

async function initSetup() {
    try {
        // ดึง droneId จาก process.env ผ่าน Backend
        const response = await fetch(`${API_URL}/api/setup`);
        if (!response.ok) throw new Error("Failed to load setup");
        
        const data = await response.json();
        DRONE_ID = Number(data.droneId);

        // โหลดข้อมูลตามหน้าเมื่อได้ DRONE_ID แล้ว
        loadConfig();
        loadLogs();

    } catch (error) {
        console.error("Setup Error:", error);
        alert("Cannot fetch initial drone setup from server");
    }
}


// ==========================================
// PAGE 1: VIEW CONFIG
// ==========================================

async function loadConfig() {
    if (!DRONE_ID) return;

    try {
        const response = await fetch(`${API_URL}/configs/${DRONE_ID}`);

        if (!response.ok) {
            throw new Error("Failed to load config");
        }

        const config = await response.json();

        // Safe element assignment (ป้องกัน error กรณี element ไม่ได้อยู่ในหน้านั้น)
        const setField = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val ?? "-";
        };

        setField("droneId", config.drone_id);
        setField("droneName", config.drone_name);
        setField("light", config.light);
        setField("country", config.country);
        setField("formDroneName", config.drone_name);
        setField("formDroneCountry", config.country);

    } catch (error) {
        console.error("Config Error:", error);
    }
}


// ==========================================
// PAGE 2: TEMPERATURE LOG FORM
// ==========================================

async function submitTemperature(event) {
    event.preventDefault();

    const tempInput = document.getElementById("temperature");
    const temperature = Number(tempInput.value);
    const formMessage = document.getElementById("formMessage");
    if (formMessage) {
        formMessage.textContent = "";
        formMessage.classList.remove("success");
    }

    if (!Number.isFinite(temperature)) {
        alert("Please enter a valid temperature");
        return;
    }

    if (!DRONE_ID) {
        alert("Drone ID not loaded yet");
        return;
    }

    const submitBtn = document.getElementById("submitTemperatureBtn");
    const submitProgress = document.getElementById("submitProgress");
    const submitForm = document.getElementById("temperatureForm");
    const setSubmitting = (isSubmitting) => {
        if (submitBtn) submitBtn.disabled = isSubmitting;
        if (submitProgress) submitProgress.hidden = !isSubmitting;
        if (submitForm) submitForm.setAttribute("aria-busy", String(isSubmitting));
    };
    setSubmitting(true);

    try {
        // 1. ดึงข้อมูล Drone Config ก่อนส่ง
        const configResponse = await fetch(`${API_URL}/configs/${DRONE_ID}`);
        if (!configResponse.ok) {
            throw new Error("Cannot get drone config");
        }
        const config = await configResponse.json();

        // 2. เตรียมข้อมูล Payload
        const logData = {
            drone_id: config.drone_id,
            drone_name: config.drone_name,
            country: config.country,
            celsius: temperature
        };

        // 3. ยิง API POST ไปยัง Express Backend
        const response = await fetch(`${API_URL}/logs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(logData)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error("Failed to submit temperature");
        }

        if (formMessage) {
            formMessage.textContent = "Success — temperature log saved.";
            formMessage.classList.add("success");
        }
        tempInput.value = "";

        // Reload logs หลังบันทึกสำเร็จ
        currentPage = 1;
        loadLogs();

    } catch (error) {
        console.error("Submit Error:", error);
        alert("Cannot submit temperature");
    }
    finally {
        setSubmitting(false);
    }
}


// ==========================================
// PAGE 3: VIEW LOGS
// ==========================================

async function loadLogs() {
    if (!DRONE_ID) return;

    try {
        const response = await fetch(`${API_URL}/logs/${DRONE_ID}?page=${currentPage}`);

        if (!response.ok) {
            throw new Error("Failed to load logs");
        }

        const logs = await response.json();

        displayLogs(logs);
        updatePagination(logs);

    } catch (error) {
        console.error("Logs Error:", error);
    }
}


// ==========================================
// DISPLAY LOGS IN TABLE
// ==========================================

function displayLogs(logs) {
    const tableBody = document.getElementById("logsTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    logs.forEach(log => {
        const row = document.createElement("tr");

        // Format วันเวลา
        const createdTd = document.createElement("td");
        createdTd.textContent = log.created ? new Date(log.created).toLocaleString("th-TH") : "-";

        const countryTd = document.createElement("td");
        countryTd.textContent = log.country || "-";

        const droneIdTd = document.createElement("td");
        droneIdTd.textContent = log.drone_id;

        const droneNameTd = document.createElement("td");
        droneNameTd.textContent = log.drone_name || "-";

        const celsiusTd = document.createElement("td");
        celsiusTd.textContent = `${log.celsius} °C`;

        row.append(
            createdTd,
            countryTd,
            droneIdTd,
            droneNameTd,
            celsiusTd
        );

        tableBody.appendChild(row);
    });
}


// ==========================================
// PAGINATION
// ==========================================

function updatePagination(logs) {
    const pageInfo = document.getElementById("pageInfo");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (pageInfo) pageInfo.textContent = `Page ${currentPage}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = logs.length < LIMIT;
}


// ==========================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const introOverlay = document.getElementById("introOverlay");
    if (introOverlay) {
        const finishIntro = () => { introOverlay.hidden = true; };
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reducedMotion) {
            finishIntro();
        } else {
            introOverlay.addEventListener("animationend", (event) => {
                if (event.animationName === "intro-dismiss") finishIntro();
            });
            window.setTimeout(finishIntro, 3000);
        }
    }

    // 1. เรียก Setup หาค่า DRONE_ID จาก Server ก่อน
    initSetup();

    // 2. ผูก Submit Event กับ Form
    const tempForm = document.getElementById("temperatureForm");
    if (tempForm) {
        tempForm.addEventListener("submit", submitTemperature);
    }

    // 3. ผูก Pagination Event
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                loadLogs();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            currentPage++;
            loadLogs();
        });
    }

    // 4. ผูก Refresh Buttons
    const refreshConfigBtn = document.getElementById("refreshConfigBtn");
    if (refreshConfigBtn) refreshConfigBtn.addEventListener("click", loadConfig);

    const refreshLogsBtn = document.getElementById("refreshLogsBtn");
    if (refreshLogsBtn) refreshLogsBtn.addEventListener("click", loadLogs);

    // 5. ระบบสลับ Tab หน้าต่าง (กรณีใช้ SPA หน้าเดียว)
    document.querySelectorAll(".tab-btn").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
            document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));

            button.classList.add("active");
            const pageId = button.dataset.page;
            const targetPage = document.getElementById(pageId);
            
            if (targetPage) targetPage.classList.add("active");

            if (pageId === "configPage" || pageId === "temperaturePage") {
                loadConfig();
            } else if (pageId === "logsPage") {
                loadLogs();
            }
        });
    });
});

