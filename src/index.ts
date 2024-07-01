document.addEventListener('DOMContentLoaded', () => {
    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
        scanButton.addEventListener('click', scanForDuplicates);
    }
});

let stylesWithProperties: Array<{ name: string, properties: any }> = [];

async function scanForDuplicates() {
    showLoading();
    const container = document.getElementById('duplicates-container');
    if (container) container.style.display = 'none';

    try {
        const allStyles = await webflow.getAllStyles();
        stylesWithProperties = [];

        for (const style of allStyles) {
            const styleName = await style.getName();
            const properties = await style.getProperties();
            stylesWithProperties.push({
                name: styleName,
                properties: properties
            });
        }

        const result = detectDuplicates(stylesWithProperties);
        displayDuplicatesAndEmptyStyles(result);
    } catch (error) {
        console.error('Error scanning for duplicates:', error);
    } finally {
        hideLoading();
        if (container) container.style.display = 'block';
    }
}

function detectDuplicates(styles: Array<{ name: string, properties: any }>) {
    const duplicates: Array<Array<string>> = [];
    const emptyStyles: Array<string> = [];
    const processed = new Set<number>();

    for (let i = 0; i < styles.length; i++) {
        const { name: name1, properties: properties1 } = styles[i];
        if (Object.keys(properties1).length === 0) {
            emptyStyles.push(name1);
            processed.add(i);
            continue;
        }
        if (processed.has(i)) continue;
        const duplicateGroup = [name1];
        for (let j = i + 1; j < styles.length; j++) {
            if (processed.has(j)) continue;
            const { name: name2, properties: properties2 } = styles[j];
            if (JSON.stringify(properties1) === JSON.stringify(properties2)) {
                duplicateGroup.push(name2);
                processed.add(j);
            }
        }
        if (duplicateGroup.length > 1) {
            duplicates.push(duplicateGroup);
        }
        processed.add(i);
    }

    return { duplicates, emptyStyles };
}

function displayDuplicatesAndEmptyStyles(data: { duplicates: Array<Array<string>>, emptyStyles: Array<string> }) {
    const container = document.getElementById('duplicates-container');
    if (container) {
        container.innerHTML = '';

        data.duplicates.forEach((group, index) => {
            const style = stylesWithProperties.find(s => s.name === group[0]);
            const propertiesText = JSON.stringify(style?.properties, null, 2);

            const groupDiv = document.createElement('div');
            groupDiv.classList.add('duplicate-group');

            const groupTitle = document.createElement('h3');
            groupTitle.classList.add('group-title');
            groupTitle.textContent = `Duplicates group (${index + 1})`;

            const propertiesDiv = document.createElement('div');
            propertiesDiv.classList.add('properties-text');
            propertiesDiv.textContent = propertiesText;

            groupDiv.appendChild(groupTitle);
            groupDiv.appendChild(propertiesDiv);

            const ul = document.createElement('ul');
            group.forEach(name => {
                const li = document.createElement('li');
                li.textContent = name;
                li.addEventListener('click', () => {
                    selectStyleInWebflow(name);
                });
                ul.appendChild(li);
            });
            groupDiv.appendChild(ul);

            container.appendChild(groupDiv);
        });

        const emptyContainer = document.createElement('div');
        emptyContainer.classList.add('empty-styles');

        const emptyTitle = document.createElement('h3');
        emptyTitle.textContent = 'Empty Styles';
        emptyContainer.appendChild(emptyTitle);

        const ul = document.createElement('ul');
        data.emptyStyles.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            ul.appendChild(li);
        });
        emptyContainer.appendChild(ul);

        container.appendChild(emptyContainer);
    }
}

function selectStyleInWebflow(styleName: string) {
    // Escape the style name and replace spaces with dots for valid CSS selector
    const escapedStyleName = CSS.escape(styleName).replace(/ /g, '.');
    const selector = `.${escapedStyleName}`;
    console.log(`Attempting to select element with selector: ${selector}`);

    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            elements.forEach(element => {
                (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                (element as HTMLElement).click();
                console.log(`Successfully selected style: ${styleName}`);
            });
        } else {
            console.log(`No elements found for style: ${styleName}`);
        }
    } catch (error) {
        console.error(`Error selecting element with selector: ${selector}`, error);
    }
}

// Loading functions
function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Example function to get all styles and log their names
async function getAllStylesAndLogNames() {
    try {
        const allStyles = await webflow.getAllStyles();
        if (allStyles.length > 0) {
            console.log("List of all styles:");
            for (let i = 0; i < allStyles.length; i++) {
                const style = allStyles[i];
                const styleName = await style.getName();
                console.log(`${i + 1}. Style Name: ${styleName}, Style ID: ${style.id}`);
            }
        } else {
            console.log("No styles found in the current context.");
        }
    } catch (error) {
        console.error('Error retrieving styles:', error);
    }
}

// Call the function to log all styles' names
getAllStylesAndLogNames();
