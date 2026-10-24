
document.addEventListener("DOMContentLoaded", function () {
    // Get HTML elements
    const inputContainer = document.getElementById("data-input-container");
    const addWordBtn = document.getElementById("add-word-btn");
    const loadExampleBtn = document.getElementById("load-example-btn");
    const calculateBtn = document.getElementById("calculate-btn");
    const sendBtn = document.getElementById("send-btn");
    const noErrorBtn = document.getElementById("no-error-btn");
    const introduceErrorBtn = document.getElementById("introduce-error-btn");
    const applyErrorBtn = document.getElementById("apply-error-btn");
    const verifyBtn = document.getElementById("verify-btn");
    const resetBtn = document.getElementById("reset-btn");

    const originalData = document.getElementById("original-data");
    const generatedChecksum = document.getElementById("generated-checksum");
    const senderData = document.getElementById("sender-data");
    const senderChecksum = document.getElementById("sender-checksum");
    const receivedData = document.getElementById("received-data");
    const receivedChecksum = document.getElementById("received-checksum");

    const errorWord = document.getElementById("error-word");
    const errorBit = document.getElementById("error-bit");
    const errorControls = document.getElementById("error-controls");
    const errorDisplay = document.getElementById("error-display");
    const errorOriginal = document.getElementById("error-original");
    const errorModified = document.getElementById("error-modified");

    const finalResult = document.getElementById("final-result");
    const resultIcon = document.getElementById("result-icon");
    const resultTitle = document.getElementById("result-title");
    const resultMessage = document.getElementById("result-message");

    let originalWords = [];
    let receivedWords = [];
    let checksum = "";
    let simulationSent = false;

    // Find all binary input fields
    function getInputFields() {
        return Array.from(
            inputContainer.querySelectorAll(".binary-input")
        );
    }

    // Read and validate the entered binary words
    function getWords() {
        const fields = getInputFields();
        const words = fields.map(field => field.value.trim());

        if (words.some(word => !/^[01]{8}$/.test(word))) {
            throw new Error(
                "Enter exactly 8 binary digits (0 or 1) in every field."
            );
        }

        return words;
    }

    // Display an error message
    function showError(message) {
        finalResult.style.display = "block";
        resultIcon.textContent = "⚠️";
        resultTitle.textContent = "Input or Request Error";
        resultMessage.textContent = message;
    }

    // Display the verification result
    function showResult(valid, message) {
        finalResult.style.display = "block";
        resultIcon.textContent = valid ? "✓" : "✕";
        resultTitle.textContent = valid
            ? "No Error Detected"
            : "Error Detected";
        resultMessage.textContent = message;

        finalResult.style.borderColor = valid ? "#16a34a" : "#dc2626";
        finalResult.style.background = valid ? "#f0fdf4" : "#fef2f2";
    }

    // Send a request to the Python Flask backend
    async function sendRequest(url, payload) {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "The request failed.");
        }

        return result;
    }

    // Update the selector used for choosing a word to modify
    function updateErrorWordOptions() {
        errorWord.innerHTML = "";

        originalWords.forEach((word, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = "Data Word " + (index + 1);
            errorWord.appendChild(option);
        });
    }

    // Add another binary input field
    addWordBtn.addEventListener("click", function () {
        const count = getInputFields().length + 1;

        const row = document.createElement("div");
        row.className = "input-row";

        const label = document.createElement("label");
        label.textContent = "Data Word " + count;
        label.htmlFor = "word" + count;

        const input = document.createElement("input");
        input.type = "text";
        input.id = "word" + count;
        input.className = "binary-input";
        input.maxLength = 8;
        input.autocomplete = "off";
        input.placeholder = "Enter 8-bit binary data";

        row.appendChild(label);
        row.appendChild(input);
        inputContainer.appendChild(row);
    });

    // Load sample data
    loadExampleBtn.addEventListener("click", function () {
        const fields = getInputFields();

        if (fields.length < 2) {
            addWordBtn.click();
        }

        const updatedFields = getInputFields();
        const examples = ["10110010", "11001010"];

        updatedFields.forEach((field, index) => {
            field.value = examples[index % examples.length];
        });

        finalResult.style.display = "none";
    });

    // Step 1: Calculate checksum using Python
    calculateBtn.addEventListener("click", async function () {
        try {
            const words = getWords();

            calculateBtn.disabled = true;
            calculateBtn.textContent = "Calculating...";

            const result = await sendRequest("/api/calculate", {
                words: words
            });

            originalWords = words.slice();
            receivedWords = words.slice();
            checksum = result.checksum;
            simulationSent = false;

            originalData.textContent = words.join(" ");
            generatedChecksum.textContent = checksum;

            senderData.textContent = words.join(" ");
            senderChecksum.textContent = checksum;

            receivedData.textContent = "—";
            receivedChecksum.textContent = "—";

            updateErrorWordOptions();

            errorControls.style.display = "none";
            errorDisplay.style.display = "none";
            finalResult.style.display = "none";

            document.getElementById("receiver-section").style.display = "block";
        } catch (error) {
            showError(error.message);
        } finally {
            calculateBtn.disabled = false;
            calculateBtn.textContent = "Calculate Checksum";
        }
    });

    // Step 2: Send the data to the simulated receiver
    sendBtn.addEventListener("click", function () {
        if (!checksum || originalWords.length === 0) {
            showError("Calculate the checksum before sending data.");
            return;
        }

        receivedWords = originalWords.slice();
        simulationSent = true;

        receivedData.textContent = receivedWords.join(" ");
        receivedChecksum.textContent = checksum;

        errorControls.style.display = "none";
        errorDisplay.style.display = "none";
        finalResult.style.display = "none";
    });

    // Send data without modifying it
    noErrorBtn.addEventListener("click", function () {
        if (!checksum || originalWords.length === 0) {
            showError("Calculate the checksum before continuing.");
            return;
        }

        receivedWords = originalWords.slice();
        simulationSent = true;

        receivedData.textContent = receivedWords.join(" ");
        receivedChecksum.textContent = checksum;

        errorControls.style.display = "none";
        errorDisplay.style.display = "none";
        showResult(true, "The original data and checksum are ready for verification.");
    });

    // Show the controls for introducing a transmission error
    introduceErrorBtn.addEventListener("click", function () {
        if (!checksum || originalWords.length === 0) {
            showError("Calculate the checksum before introducing an error.");
            return;
        }

        errorControls.style.display = "grid";
        errorDisplay.style.display = "none";
        finalResult.style.display = "none";
    });

    // Modify one bit of a selected data word
    applyErrorBtn.addEventListener("click", function () {
        if (!checksum || originalWords.length === 0) {
            showError("Calculate the checksum first.");
            return;
        }

        const wordIndex = Number(errorWord.value);
        const bitIndex = Number(errorBit.value);

        if (
            !Number.isInteger(wordIndex) ||
            wordIndex < 0 ||
            wordIndex >= originalWords.length ||
            !Number.isInteger(bitIndex) ||
            bitIndex < 0 ||
            bitIndex > 7
        ) {
            showError("Select a valid data word and bit position.");
            return;
        }

        receivedWords = originalWords.slice();

        const bits = receivedWords[wordIndex].split("");
        bits[bitIndex] = bits[bitIndex] === "0" ? "1" : "0";
        receivedWords[wordIndex] = bits.join("");

        simulationSent = true;

        errorOriginal.textContent = originalWords[wordIndex];
        errorModified.textContent = receivedWords[wordIndex];
        errorDisplay.style.display = "block";

        receivedData.textContent = receivedWords.join(" ");
        receivedChecksum.textContent = checksum;

        finalResult.style.display = "none";
    });

    // Step 4: Verify received data using Python
    verifyBtn.addEventListener("click", async function () {
        if (!simulationSent || !checksum) {
            showError("Calculate the checksum and send the data first.");
            return;
        }

        try {
            verifyBtn.disabled = true;
            verifyBtn.textContent = "Verifying...";

            const result = await sendRequest("/api/verify", {
                words: receivedWords,
                checksum: checksum
            });

            showResult(result.valid, result.message);
        } catch (error) {
            showError(error.message);
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = "Verify Checksum";
        }
    });

    // Reset the simulator
    resetBtn.addEventListener("click", function () {
        inputContainer.innerHTML = "";

        for (let i = 1; i <= 2; i++) {
            const row = document.createElement("div");
            row.className = "input-row";

            const label = document.createElement("label");
            label.htmlFor = "word" + i;
            label.textContent = "Data Word " + i;

            const input = document.createElement("input");
            input.type = "text";
            input.id = "word" + i;
            input.className = "binary-input";
            input.maxLength = 8;
            input.autocomplete = "off";
            input.placeholder = "Example: 10110010";

            row.appendChild(label);
            row.appendChild(input);
            inputContainer.appendChild(row);
        }

        originalWords = [];
        receivedWords = [];
        checksum = "";
        simulationSent = false;

        originalData.textContent = "—";
        generatedChecksum.textContent = "—";
        senderData.textContent = "—";
        senderChecksum.textContent = "—";
        receivedData.textContent = "—";
        receivedChecksum.textContent = "—";
        errorOriginal.textContent = "—";
        errorModified.textContent = "—";

        errorControls.style.display = "none";
        errorDisplay.style.display = "none";
        finalResult.style.display = "none";

        document.getElementById("receiver-section").style.display = "block";
    });
});
