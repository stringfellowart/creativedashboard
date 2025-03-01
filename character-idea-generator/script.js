async function loadData() {
    const basePath = '/Characterprompt'; // Matches your GitHub Pages URL
    try {
        const subjectsResponse = await fetch(`${basePath}/subjects.json`);
        if (!subjectsResponse.ok) throw new Error(`Subjects fetch failed: ${subjectsResponse.status}`);
        const descriptorsResponse = await fetch(`${basePath}/descriptors.json`);
        if (!descriptorsResponse.ok) throw new Error(`Descriptors fetch failed: ${subjectsResponse.status}`);
        const subjectsData = await subjectsResponse.json();
        const descriptorsData = await descriptorsResponse.json();
        console.log('Subjects:', subjectsData.subjects);
        console.log('Descriptors:', descriptorsData.descriptors);
        return {
            subjects: subjectsData.subjects,
            descriptors: descriptorsData.descriptors
        };
    } catch (error) {
        console.error('Error loading JSON files:', error);
        return { subjects: [], descriptors: [], error: error.message };
    }
}

async function generatePrompts() {
    const count = parseInt(document.getElementById("count").value) || 1; // Default to 1 if empty
    const output = document.getElementById("output");
    output.innerHTML = ""; // Clear previous list

    if (count < 1 || count > 100) {
        output.innerHTML = "<li>Please enter a number between 1 and 100.</li>";
        return;
    }

    const data = await loadData();
    if (data.subjects.length === 0 || data.descriptors.length === 0) {
        output.innerHTML = `<li>Error: Could not load prompt data. ${data.error || "Check console for details."}</li>`;
        return;
    }

    const usedSubjects = new Map(); // Track subject usage
    const usedDescriptors = new Map(); // Track descriptor usage
    const maxRepeats = 2; // Max times any subject or descriptor can appear
    const prompts = [];

    for (let i = 0; i < count; i++) {
        let subject, descriptor, attempts = 0;
        const maxAttempts = 10; // Prevent infinite loops

        // Pick a subject with limited repeats
        do {
            subject = data.subjects[Math.floor(Math.random() * data.subjects.length)];
            attempts++;
        } while (usedSubjects.get(subject) >= maxRepeats && attempts < maxAttempts);
        usedSubjects.set(subject, (usedSubjects.get(subject) || 0) + 1);

        // Pick a descriptor with limited repeats
        attempts = 0;
        do {
            descriptor = data.descriptors[Math.floor(Math.random() * data.descriptors.length)];
            attempts++;
        } while (usedDescriptors.get(descriptor) >= maxRepeats && attempts < maxAttempts);
        usedDescriptors.set(descriptor, (usedDescriptors.get(descriptor) || 0) + 1);

        // Capitalize the first letter of the subject
        const capitalizedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
        const prompt = `Day ${i + 1}: ${capitalizedSubject} ${descriptor}`;
        prompts.push(prompt);
    }

    // Display prompts in the list
    prompts.forEach(prompt => {
        const li = document.createElement("li");
        li.textContent = prompt;
        output.appendChild(li);
    });

    // Log usage for debugging
    console.log('Used Subjects:', Object.fromEntries(usedSubjects));
    console.log('Used Descriptors:', Object.fromEntries(usedDescriptors));
}

function exportToTxt() {
    const savedPrompts = document.getElementById("savedPrompts").value;
    if (!savedPrompts.trim()) {
        alert("No prompts to export!");
        return;
    }

    const blob = new Blob([savedPrompts], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "saved_prompts.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
