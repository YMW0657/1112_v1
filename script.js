let selectedColor = '';
let selectedLabelName = ''; // 添加变量以保存当前选择的标签名
const highlightColors = [
    '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff',
    '#ff7eb9', '#ff65a3', '#7afcff', '#feff9c', '#fff740', '#ff9ee7', '#ffd700', 
    '#c1aff0', '#6eb5ff', '#ffc8a2', '#a79aff', '#ffaaa5', '#a8e6cf', '#dcedc1'  
];


// Function to add a custom label button with a delete button
function addCustomLabel(labelName) {
    const labelsContainer = document.getElementById('labels-container');
    const labelWrapper = document.createElement('div');
    labelWrapper.className = 'label-wrapper';

    const newButton = document.createElement('button');
    newButton.className = 'label-btn';
    newButton.textContent = labelName;

    // 从预定义颜色数组中随机选择一个颜色
    const color = highlightColors[Math.floor(Math.random() * highlightColors.length)];
    newButton.style.backgroundColor = color;
    newButton.dataset.color = color;
    newButton.addEventListener('click', function() {
        selectedColor = this.dataset.color;
        selectedLabelName = labelName;
    });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-label-btn';
    deleteButton.textContent = '✖';
    deleteButton.addEventListener('click', function(event) {
        event.stopPropagation();
        removeLabel(labelWrapper);
    });

    labelWrapper.appendChild(newButton);
    labelWrapper.appendChild(deleteButton);
    labelsContainer.appendChild(labelWrapper);
}

// Function to remove a label
function removeLabel(labelWrapper) {
    labelWrapper.remove(); // This removes the label wrapper and button from the DOM
}



// Event listener for the custom label addition
document.getElementById('add-custom-label').addEventListener('click', function() {
    const customLabelName = document.getElementById('custom-label-name').value.trim();
    const color = '#' + ('000000' + (Math.random() * 0xFFFFFF << 0).toString(16)).slice(-6);
    if (customLabelName) {
        addCustomLabel(customLabelName, color);
        document.getElementById('custom-label-name').value = ''; // Clear the input after adding
    } else {
        alert('Label name cannot be empty.');
    }
});

// Function to clear all highlights
function clearHighlights() {
    document.querySelectorAll('.highlight').forEach(highlight => {
        const textNode = document.createTextNode(highlight.textContent);
        highlight.parentNode.replaceChild(textNode, highlight);
    });
}

// Event listener for clearing highlights
document.getElementById('clear-highlights').addEventListener('click', clearHighlights);

// Function to cancel a highlight
function cancelHighlight(event) {
    // Check if the clicked element has the highlight class
    if (event.target.classList.contains('highlight')) {
        // Create a new text node containing the same text
        const textNode = document.createTextNode(event.target.textContent);
        // Replace the highlight span with the text node
        event.target.parentNode.replaceChild(textNode, event.target);
    }
}


// Toggle for delete highlight mode
let isDeleteModeActive = false;
// Toggle for delete highlight mode
document.getElementById('delete-highlight').addEventListener('click', function() {
    const contentDiv = document.getElementById('dialogue-content');
    if (!isDeleteModeActive) {
        contentDiv.addEventListener('click', cancelHighlight, true);
        this.textContent = 'Click highlighted text to cancel highlighting';
        this.style.backgroundColor = '#aaa';
    } else {
        contentDiv.removeEventListener('click', cancelHighlight, true);
        this.textContent = 'Cancel Highlight';
        this.style.backgroundColor = '#0056b3';
    }
    isDeleteModeActive = !isDeleteModeActive;
});


// Event listener for text selection and highlighting
// Modify the mouseup event listener on the dialogue-content
// Only highlight if a color is selected, otherwise do nothing
document.getElementById('dialogue-content').addEventListener('mouseup', function() {
    if (selectedColor && window.getSelection().toString().trim() !== '') {
        highlightSelection(selectedColor);
    }
});

// Function to highlight the selection
function highlightSelection(color) {
    const selection = window.getSelection();
    if (!selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.classList.add('highlight');
        span.setAttribute('data-label', selectedLabelName); // 设置 data-label 属性
        range.surroundContents(span);
        selection.removeAllRanges();
    }
}

// File input and processing
document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
        });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        dialogues = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            dateNF: "HH:mm:ss"
        });
    };
    reader.readAsArrayBuffer(file);
});

// Displaying the content from the file
document.getElementById('confirm-button').addEventListener('click', function() {
    const contentDiv = document.getElementById('dialogue-content');
    contentDiv.innerHTML = '';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    //const headers = ['ID', 'Timestamp', 'Content'];
    const headers = ['Speaker', 'Content'];

    headers.forEach((headerText, index) => {
        const header = document.createElement('th');
        header.textContent = headerText;
        header.classList.add(index < 2 ? 'fixed-width' : 'content-column');
        headerRow.appendChild(header);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    dialogues.forEach(dialogue => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const cell = document.createElement('td');
            cell.textContent = dialogue[header];
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    contentDiv.appendChild(table);

    document.getElementById('download-button').style.display = 'block';
});

function collectAnnotatedData() {
    const annotatedData = [];
    // Collect all highlighted spans
    document.querySelectorAll('.highlight').forEach((highlight) => {
        const text = highlight.textContent || highlight.innerText; // Get the text content
        const label = highlight.getAttribute('data-label'); // Get the label
        annotatedData.push({ Content: text, Label: label }); // Add to the data array
    });
    return annotatedData;
}

// Function to download data as Excel
function downloadExcel(data) {
    const worksheet = XLSX.utils.json_to_sheet(data); // Convert JSON to worksheet
    const workbook = XLSX.utils.book_new(); // Create a new workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Annotations'); // Append the sheet
    XLSX.writeFile(workbook, 'annotations.xlsx'); // Write the file
}

document.getElementById('download-button').addEventListener('click', () => {
    const data = collectAnnotatedData(); // Get the annotated data
    downloadExcel(data); // Download the data as Excel
});
